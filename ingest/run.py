import os
import yaml
import asyncio
import logging
import argparse
from datetime import datetime, timezone
from sqlalchemy import select, delete, func
from sqlalchemy.ext.asyncio import AsyncSession

# Ensure workspace root is in sys.path
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.db import AsyncSessionLocal, engine
from api.models.scheme import Scheme, Document, Chunk
from ingest.fetcher import fetch_scheme_guidelines
from ingest.cleaner import clean_document
from ingest.chunker import chunk_document
from ingest.embedder import get_embedder

logger = logging.getLogger("sahayak.ingest.run")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

async def load_corpus_manifest(manifest_path: str = "ingest/corpus.yaml") -> list[dict]:
    with open(manifest_path, "r") as f:
        data = yaml.safe_load(f)
    return data.get("schemes", [])

async def ingest_scheme(db: AsyncSession, scheme_data: dict, force: bool = False) -> None:
    scheme_id = scheme_data["id"]
    name = scheme_data["name"]
    state = scheme_data["state"]
    category = scheme_data["category"]
    ministry = scheme_data.get("ministry")
    official_url = scheme_data.get("official_url")
    source_url = scheme_data["source_url"]

    # 1. Fetch guideline file
    fetch_result = fetch_scheme_guidelines(scheme_id, source_url)

    if fetch_result.status == "failed":
        logger.warning(
            f"Failed to fetch guidelines for scheme '{scheme_id}' from {source_url}: "
            f"{fetch_result.error} (http_status={fetch_result.http_status}). "
            "Skipping ingestion - no Document will be created."
        )
        # Ensure the Scheme row exists, marked unverified. No Document or
        # chunks are created and nothing is indexed.
        stmt_scheme = select(Scheme).where(Scheme.id == scheme_id)
        result_scheme = await db.execute(stmt_scheme)
        db_scheme = result_scheme.scalars().first()

        if not db_scheme:
            db_scheme = Scheme(
                id=scheme_id,
                name=name,
                state=state,
                category=category,
                ministry=ministry,
                official_url=official_url,
                status="unverified",
            )
            db.add(db_scheme)
            await db.flush()
        else:
            db_scheme.status = "unverified"
        return

    checksum = fetch_result.checksum
    file_path = fetch_result.file_path
    doc_type = fetch_result.doc_type

    # 2. Check if document already exists with same checksum (Idempotency)
    stmt = select(Document).where(Document.checksum == checksum)
    result = await db.execute(stmt)
    existing_doc = result.scalars().first()

    if existing_doc and not force:
        # Same bytes as last time. We're not replacing the Document or its
        # chunks, but the verification evidence for those exact bytes may
        # have improved (e.g. a prior run only had a "cached" fallback and
        # this run just confirmed the identical content live) - refresh it
        # so a previously uncitable document doesn't stay uncitable forever.
        #
        # This must only ever UPGRADE verified_at, never downgrade it. A
        # checksum match means the bytes are identical, so an earlier
        # confirmation is still valid evidence - losing this run's sidecar
        # (backup restore, gitignore rule, whatever) doesn't retroactively
        # make an earlier verified fetch not have happened. fetch_status
        # rides along with verified_at: a stored "fetched" is never
        # overwritten by this run's "cached" unless it's a genuine upgrade.
        if fetch_result.fetched_at is not None and (
            existing_doc.verified_at is None
            or fetch_result.fetched_at > existing_doc.verified_at
        ):
            existing_doc.verified_at = fetch_result.fetched_at
            existing_doc.fetch_status = fetch_result.status
        existing_doc.content_sha256 = fetch_result.content_sha256
        logger.info(f"Skipping scheme '{scheme_id}': Document matches checksum {checksum}")
        return

    logger.info(f"Ingesting scheme '{scheme_id}'...")

    # 3. Create or update Scheme model
    stmt_scheme = select(Scheme).where(Scheme.id == scheme_id)
    result_scheme = await db.execute(stmt_scheme)
    db_scheme = result_scheme.scalars().first()

    if not db_scheme:
        db_scheme = Scheme(
            id=scheme_id,
            name=name,
            state=state,
            category=category,
            ministry=ministry,
            official_url=official_url,
            status="active"
        )
        db.add(db_scheme)
        await db.flush()
    else:
        # Update details
        db_scheme.name = name
        db_scheme.state = state
        db_scheme.category = category
        db_scheme.ministry = ministry
        db_scheme.official_url = official_url
        db_scheme.status = "active"

    # 4. If document exists but checksum changed, delete the old document (cascade deletes old chunks)
    if existing_doc:
        logger.info(f"Document checksum changed for '{scheme_id}'. Replacing old document.")
        await db.delete(existing_doc)
        await db.flush()
    else:
        # Also clean up any other documents for this scheme just in case
        stmt_docs = select(Document).where(Document.scheme_id == scheme_id)
        res_docs = await db.execute(stmt_docs)
        for old_doc in res_docs.scalars().all():
            await db.delete(old_doc)
        await db.flush()

    # 5. Clean / parse document contents
    cleaned_text = clean_document(file_path, doc_type)

    # 6. Create Document record
    db_doc = Document(
        scheme_id=scheme_id,
        title=name,
        source_url=source_url,
        doc_type=doc_type,
        lang="en",
        fetched_at=datetime.now(timezone.utc),
        checksum=checksum,
        fetch_status=fetch_result.status,
        verified_at=fetch_result.fetched_at,
        content_sha256=fetch_result.content_sha256,
    )
    db.add(db_doc)
    await db.flush()  # Populates db_doc.id

    # 7. Generate Chunks
    chunks_data = chunk_document(cleaned_text, name)
    if not chunks_data:
        logger.warning(f"No chunks extracted for scheme '{scheme_id}'")
        return

    # 8. Generate Embeddings in batch
    embedder = get_embedder()
    texts = [(c["heading_path"] or "") + " " + c["text"] for c in chunks_data]
    logger.info(f"Generating embeddings for {len(texts)} chunks of scheme '{scheme_id}'...")
    embeddings = embedder.embed_batch(texts)

    # 9. Persist Chunks
    for i, c in enumerate(chunks_data):
        db_chunk = Chunk(
            document_id=db_doc.id,
            seq=c["seq"],
            heading_path=c["heading_path"],
            text=c["text"],
            tokens=c["tokens"],
            embedding=embeddings[i],
            tsv=func.to_tsvector("english", c["text"])
        )
        db.add(db_chunk)

    logger.info(f"Successfully ingested {len(chunks_data)} chunks for scheme '{scheme_id}'")

async def run_pipeline(scheme_id: str | None = None, force: bool = False) -> None:
    # Read manifest
    schemes = await load_corpus_manifest()
    
    # Filter if specific scheme is requested
    if scheme_id:
        schemes = [s for s in schemes if s["id"] == scheme_id]
        if not schemes:
            logger.error(f"Scheme '{scheme_id}' not found in corpus manifest.")
            return

    async with AsyncSessionLocal() as db:
        try:
            for scheme in schemes:
                await ingest_scheme(db, scheme, force=force)
            await db.commit()
            logger.info("Ingestion pipeline run completed successfully.")
        except Exception as e:
            await db.rollback()
            logger.error(f"Ingestion pipeline failed: {str(e)}", exc_info=True)
            raise e

def main():
    parser = argparse.ArgumentParser(description="Sahayak Welfare Scheme Ingestion CLI")
    parser.add_argument("--scheme", type=str, help="Specific scheme ID to ingest")
    parser.add_argument("--force", action="store_true", help="Force ingestion regardless of checksum match")
    args = parser.parse_args()

    asyncio.run(run_pipeline(scheme_id=args.scheme, force=args.force))

if __name__ == "__main__":
    main()

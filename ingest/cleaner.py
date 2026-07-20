import logging
import pdfplumber
from bs4 import BeautifulSoup
import trafilatura

logger = logging.getLogger("sahayak.ingest.cleaner")

def convert_html_table_to_markdown(table_tag) -> str:
    """Helper to convert a BeautifulSoup table tag into a Markdown table."""
    markdown_lines = []
    rows = table_tag.find_all("tr")
    if not rows:
        return ""
    
    # Process header rows vs body rows
    for i, row in enumerate(rows):
        cells = row.find_all(["td", "th"])
        cell_texts = [cell.get_text(strip=True).replace("|", "\\|") for cell in cells]
        
        # Format row
        row_str = "| " + " | ".join(cell_texts) + " |"
        markdown_lines.append(row_str)
        
        # Add separator line after first row (header)
        if i == 0:
            separator = "| " + " | ".join(["---"] * len(cells)) + " |"
            markdown_lines.append(separator)
            
    return "\n" + "\n".join(markdown_lines) + "\n"

def clean_html_content(html_content: str) -> str:
    """Parses HTML raw content, converting headings and tables to Markdown, and extracting text."""
    soup = BeautifulSoup(html_content, "html.parser")
    
    # Remove script and style tags
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
        
    # Convert headings
    for h in soup.find_all(["h1", "h2", "h3", "h4", "h5", "h6"]):
        level = int(h.name[1])
        h.replace_with(f"\n\n{'#' * level} {h.get_text(strip=True)}\n\n")
        
    # Convert tables to markdown
    for table in soup.find_all("table"):
        md_table = convert_html_table_to_markdown(table)
        table.replace_with(soup.new_string(md_table))
        
    # Extract structural text with trafilatura as a fallback or extract directly from processed soup
    text = soup.get_text(separator="\n")
    
    # Post-process whitespace
    lines = [line.strip() for line in text.split("\n")]
    cleaned_lines = []
    for line in lines:
        if line:
            cleaned_lines.append(line)
        elif not cleaned_lines or cleaned_lines[-1] != "":
            cleaned_lines.append("")
            
    return "\n".join(cleaned_lines).strip()

def convert_pdf_table_to_markdown(table_data: list) -> str:
    """Converts a raw list-of-lists table from pdfplumber to a Markdown table."""
    if not table_data or not table_data[0]:
        return ""
    
    markdown_lines = []
    num_cols = len(table_data[0])
    
    # Process each row
    for i, row in enumerate(table_data):
        # Handle None cell values
        cells = [str(cell or "").strip().replace("\n", " ").replace("|", "\\|") for cell in row]
        row_str = "| " + " | ".join(cells) + " |"
        markdown_lines.append(row_str)
        
        # Add separator after header row
        if i == 0:
            separator = "| " + " | ".join(["---"] * num_cols) + " |"
            markdown_lines.append(separator)
            
    return "\n" + "\n".join(markdown_lines) + "\n"

def clean_pdf_content(pdf_path: str) -> str:
    """
    Extracts text and tables page-by-page from a PDF using pdfplumber,
    converting tables to Markdown and stripping page headers/footers.
    """
    cleaned_pages = []
    
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages):
            page_text = page.extract_text() or ""
            
            # Extract tables
            tables = page.extract_tables()
            md_tables = []
            for table in tables:
                md_table = convert_pdf_table_to_markdown(table)
                if md_table:
                    md_tables.append(md_table)
            
            # Combine text and tables
            combined_text = page_text
            if md_tables:
                combined_text += "\n\n### Tables in Page " + str(page_num + 1) + "\n" + "\n".join(md_tables)
                
            # Filter lines (e.g. skip empty footer-like lines, page numbers)
            lines = combined_text.split("\n")
            filtered_lines = []
            for line in lines:
                stripped = line.strip()
                # Skip simple page numbers (e.g., "Page 1 of 5", "1")
                if stripped.isdigit() or (stripped.lower().startswith("page") and len(stripped) < 15):
                    continue
                filtered_lines.append(line)
                
            cleaned_pages.append("\n".join(filtered_lines))
            
    return "\n\n--- PAGE BREAK ---\n\n".join(cleaned_pages).strip()

def clean_document(file_path: str, doc_type: str) -> str:
    """Orchestrates document cleaning based on its type."""
    logger.info(f"Cleaning document {file_path} of type {doc_type}")
    if doc_type == "pdf":
        return clean_pdf_content(file_path)
    elif doc_type == "html":
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        return clean_html_content(content)
    else:
        raise ValueError(f"Unsupported document type: {doc_type}")

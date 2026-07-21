import logging

from api.llm.client import get_llm_client

logger = logging.getLogger("sahayak.api.services.translation")


def is_hindi(text: str) -> bool:
    """Helper to detect if text contains Devanagari characters."""
    if not text:
        return False
    return any("\u0900" <= char <= "\u097f" for char in text)


# Golden translation dictionary from retrieval
HINDI_TO_ENGLISH = {
    "पीएम-किसान योजना के लिए कौन पात्र है?": "Who is eligible for PM-KISAN?",
    "पीएम-किसान योजना के तहत कितनी वित्तीय सहायता मिलती है?": (
        "What are the benefits of PM-KISAN?"
    ),
    "पीएम-किसान योजना की अपवर्जन श्रेणियां क्या हैं?": (
        "What is the exclusion criteria of PM-KISAN?"
    ),
    "राष्ट्रीय छात्रवृत्ति पोर्टल पोस्ट-मैट्रिक योजना के लिए पात्रता क्या है?": (
        "What is the eligibility for NSP Post-Matric SC scholarship?"
    ),
    "आयुष्मान भारत पीएम-जेएवाई योजना के लिए कौन आवेदन कर सकता है?": (
        "Who qualifies for Ayushman Bharat PM-JAY?"
    ),
    "अटल पेंशन योजना के लिए पात्रता शर्तें क्या हैं?": ("Who qualifies for Atal Pension Yojana?"),
    "कर्नाटक गृह ज्योति योजना के लिए कौन पात्र है?": ("Who qualifies for Ka Gruha Jyothi?"),
    "मध्य प्रदेश लाडली बहना योजना के लिए पात्रता क्या है?": (
        "What are the rules for Mukhyamantri Ladli Behna Yojana in MP?"
    ),
    "बिहार छात्र क्रेडिट कार्ड योजना के लिए कौन पात्र है?": (
        "Who can get Bihar Student Credit Card?"
    ),
    "पीएम मातृ वंदना योजना के लिए कौन पात्र है?": ("Who is eligible for PM Matru Vandana?"),
    "वाईएसआर चेयुथा योजना के लिए पात्रता मानदंड क्या हैं?": ("Who qualifies for YSR Cheyutha?"),
    "ओडिशा कालिया योजना के लिए कौन पात्र है?": "Who qualifies for Odisha Kalia?",
}


async def translate_hindi_to_english(query: str) -> str:
    """Translates Hindi queries to English.

    Uses static golden map first, then falls back to LLM translation.
    """
    if not is_hindi(query):
        return query

    # 1. Check static golden map
    if query in HINDI_TO_ENGLISH:
        logger.info(f"Translating query via HINDI_TO_ENGLISH map: '{query}'")
        return HINDI_TO_ENGLISH[query]

    # 2. Call LLM for translation
    logger.info(f"Translating query via LLM: '{query}'")
    llm_client = get_llm_client()
    system_prompt = (
        "You are a translation assistant. Translate the following Hindi query "
        "into plain English. Output ONLY the English translation, no other text."
    )
    messages = [{"role": "user", "content": query}]

    try:
        response = await llm_client.generate_response(
            system_prompt, messages, temperature=0.0
        )
        return str(response["content"]).strip()
    except Exception as e:
        logger.error(f"LLM translation failed: {str(e)}")

    return query

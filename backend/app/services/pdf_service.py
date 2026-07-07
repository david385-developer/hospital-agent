# backend/app/services/pdf_service.py
import logging
import fitz  # PyMuPDF

logger = logging.getLogger("hospital_ops.pdf_service")

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extracts text from PDF bytes using PyMuPDF.
    """
    try:
        logger.info("Starting text extraction from PDF...")
        # Open PDF from bytes stream
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        
        extracted_text_list = []
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            page_text = page.get_text()
            if page_text:
                extracted_text_list.append(page_text)
                
        doc.close()
        full_text = "\n".join(extracted_text_list)
        logger.info(f"Extracted {len(full_text)} characters from {len(doc)} pages of PDF.")
        return full_text
    except Exception as e:
        logger.error(f"Failed to extract text from PDF: {e}")
        raise RuntimeError("PDF text extraction failed.")

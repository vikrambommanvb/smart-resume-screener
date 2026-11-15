import pymupdf as fitz
import pytest

from app.pipeline.extract import PDFExtractionError, extract_pdf_in_memory


@pytest.mark.asyncio
async def test_not_a_pdf() -> None:
    fake_bytes = b"This is plain text, not a PDF document."
    with pytest.raises(PDFExtractionError) as exc_info:
        await extract_pdf_in_memory(fake_bytes)
    assert exc_info.value.code == "NOT_A_PDF"


@pytest.mark.asyncio
async def test_oversized_pdf() -> None:
    # 5 MB + 1 byte
    oversized_bytes = b"%PDF-" + b"0" * (5 * 1024 * 1024 + 10)
    with pytest.raises(PDFExtractionError) as exc_info:
        await extract_pdf_in_memory(oversized_bytes)
    assert exc_info.value.code == "TOO_LARGE"


@pytest.mark.asyncio
async def test_encrypted_pdf() -> None:
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 50), "Encrypted resume content")
    # Save with user password encryption
    pdf_bytes = doc.tobytes(encryption=fitz.PDF_ENCRYPT_AES_256, user_pw="secret123")
    doc.close()

    with pytest.raises(PDFExtractionError) as exc_info:
        await extract_pdf_in_memory(pdf_bytes)
    assert exc_info.value.code == "ENCRYPTED_PDF"


@pytest.mark.asyncio
async def test_too_many_pages() -> None:
    doc = fitz.open()
    for _ in range(9):
        page = doc.new_page()
        page.insert_text((50, 50), "Sample text page content")
    pdf_bytes = doc.tobytes()
    doc.close()

    with pytest.raises(PDFExtractionError) as exc_info:
        await extract_pdf_in_memory(pdf_bytes)
    assert exc_info.value.code == "TOO_MANY_PAGES"


@pytest.mark.asyncio
async def test_scanned_pdf_without_fallback() -> None:
    doc = fitz.open()
    page = doc.new_page()
    # Insert tiny text (< 300 chars)
    page.insert_text((50, 50), "Short scan label")
    pdf_bytes = doc.tobytes()
    doc.close()

    with pytest.raises(PDFExtractionError) as exc_info:
        await extract_pdf_in_memory(pdf_bytes, allow_scan_fallback=False)
    assert exc_info.value.code == "SCANNED_PDF"


@pytest.mark.asyncio
async def test_scanned_pdf_with_fallback() -> None:
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 50), "Short scan label")
    pdf_bytes = doc.tobytes()
    doc.close()

    result = await extract_pdf_in_memory(pdf_bytes, allow_scan_fallback=True)
    assert result.is_scanned is True
    assert result.warning is not None


@pytest.mark.asyncio
async def test_two_column_reading_order() -> None:
    doc = fitz.open()
    page = doc.new_page(width=600, height=800)

    # Full width header (x=50 to 550, y=30 to 80)
    page.insert_textbox(fitz.Rect(50, 30, 550, 80), "FULL WIDTH HEADER: JOHN DOE\nSenior Software Engineer with extensive experience in cloud computing and distributed microservices architecture.")

    # Left column (x=50 to 250, y=100 to 300)
    page.insert_textbox(fitz.Rect(50, 100, 250, 300), "LEFT COLUMN ITEM 1\nEngineered backend services with Python and FastAPI.\nLEFT COLUMN ITEM 2\nImplemented PostgreSQL indexing and query optimization.")

    # Right column (x=350 to 550, y=100 to 300)
    page.insert_textbox(fitz.Rect(350, 100, 550, 300), "RIGHT COLUMN ITEM 1\nManaged Docker containers and Kubernetes clusters.\nRIGHT COLUMN ITEM 2\nAutomated CI/CD workflows using GitHub Actions.")

    pdf_bytes = doc.tobytes()
    doc.close()

    result = await extract_pdf_in_memory(pdf_bytes)
    assert not result.is_scanned
    text = result.raw_text

    # Header must appear before column items
    assert text.index("FULL WIDTH HEADER") < text.index("LEFT COLUMN ITEM 1")
    # Left column item 1 must appear before right column item 1
    assert text.index("LEFT COLUMN ITEM 1") < text.index("RIGHT COLUMN ITEM 1")

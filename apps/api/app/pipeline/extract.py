import asyncio
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass

import pymupdf as fitz


class PDFExtractionError(Exception):
    def __init__(self, code: str, message: str) -> None:
        self.code = code
        self.message = message
        super().__init__(message)


@dataclass
class ExtractedBlock:
    text: str
    bbox: tuple[float, float, float, float]
    page_num: int
    column_idx: int = 0


@dataclass
class ExtractedDocument:
    raw_text: str
    blocks: list[ExtractedBlock]
    page_count: int
    is_scanned: bool = False
    warning: str | None = None


_executor = ThreadPoolExecutor(max_workers=4)


def _detect_columns_and_sort_blocks(page: fitz.Page, page_num: int) -> list[ExtractedBlock]:
    """Extracts text blocks and detects multi-column layouts by clustering x-origins."""
    # "blocks" format: (x0, y0, x1, y1, text, block_no, block_type)
    # block_type 0 is text, 1 is image
    raw_blocks = page.get_text("blocks")
    text_blocks = [b for b in raw_blocks if b[6] == 0 and b[4].strip()]
    if not text_blocks:
        return []

    # Get page width
    rect = page.rect
    mid_x = rect.width / 2.0

    # Classify blocks into columns based on x0 and x1
    # Check if there is clear two-column separation
    left_col: list[ExtractedBlock] = []
    right_col: list[ExtractedBlock] = []
    single_col: list[ExtractedBlock] = []

    has_multi_column = False
    for b in text_blocks:
        x0, y0, x1, y1, text = b[0], b[1], b[2], b[3], b[4]
        # If block stays completely to the left or right of center
        if x1 <= mid_x + 20:
            left_col.append(ExtractedBlock(text=text.strip(), bbox=(x0, y0, x1, y1), page_num=page_num, column_idx=0))
            has_multi_column = True
        elif x0 >= mid_x - 20:
            right_col.append(ExtractedBlock(text=text.strip(), bbox=(x0, y0, x1, y1), page_num=page_num, column_idx=1))
            has_multi_column = True
        else:
            single_col.append(ExtractedBlock(text=text.strip(), bbox=(x0, y0, x1, y1), page_num=page_num, column_idx=0))

    if has_multi_column and left_col and right_col:
        # Sort each column top-to-bottom by y0
        left_col.sort(key=lambda b: b.bbox[1])
        right_col.sort(key=lambda b: b.bbox[1])
        single_col.sort(key=lambda b: b.bbox[1])
        # Reading order: full-width headers first, then left column, then right column
        top_single = [b for b in single_col if b.bbox[1] < min(left_col[0].bbox[1], right_col[0].bbox[1])]
        bottom_single = [b for b in single_col if b not in top_single]
        return top_single + left_col + right_col + bottom_single
    else:
        # Standard top-to-bottom reading order
        all_blocks = [
            ExtractedBlock(text=b[4].strip(), bbox=(b[0], b[1], b[2], b[3]), page_num=page_num, column_idx=0)
            for b in text_blocks
        ]
        all_blocks.sort(key=lambda b: (b.bbox[1], b.bbox[0]))
        return all_blocks


def _parse_pdf_sync(content: bytes, allow_scan_fallback: bool = False) -> ExtractedDocument:
    # 1. Size cap check (5 MB)
    if len(content) > 5 * 1024 * 1024:
        raise PDFExtractionError(
            code="TOO_LARGE",
            message="Resume file size exceeds the 5 MB limit. Please compress or export a smaller PDF.",
        )

    # 2. Magic bytes check
    if not content.startswith(b"%PDF-"):
        raise PDFExtractionError(
            code="NOT_A_PDF",
            message="The uploaded file is not a valid PDF document. Please verify the file format.",
        )

    # 3. Open with PyMuPDF in-memory stream
    try:
        doc = fitz.open(stream=content, filetype="pdf")
    except Exception as exc:
        raise PDFExtractionError(
            code="NOT_A_PDF",
            message="Could not parse PDF structure. The file may be corrupted.",
        ) from exc

    try:
        # 4. Encryption check
        if doc.is_encrypted:
            raise PDFExtractionError(
                code="ENCRYPTED_PDF",
                message="This PDF is password-protected or encrypted. Please export an unencrypted version.",
            )

        # 5. Page count checks
        page_count = doc.page_count
        if page_count == 0:
            raise PDFExtractionError(
                code="NOT_A_PDF",
                message="The PDF file has zero pages. Please upload a valid resume.",
            )

        if page_count > 8:
            raise PDFExtractionError(
                code="TOO_MANY_PAGES",
                message=f"Resume has {page_count} pages, which exceeds the maximum of 8 pages.",
            )

        # 6. Extract text blocks per page in reading order
        all_blocks: list[ExtractedBlock] = []
        for p_idx in range(page_count):
            page = doc.load_page(p_idx)
            page_blocks = _detect_columns_and_sort_blocks(page, page_num=p_idx + 1)
            all_blocks.extend(page_blocks)

        extracted_text = "\n\n".join(b.text for b in all_blocks if b.text)

        # 7. Check if document is scanned / has insufficient text layer
        if len(extracted_text.strip()) < 300:
            if not allow_scan_fallback:
                raise PDFExtractionError(
                    code="SCANNED_PDF",
                    message="This PDF contains no selectable text layer. Export it again from your editor or enable the scanned-document option.",
                )
            return ExtractedDocument(
                raw_text="",
                blocks=[],
                page_count=page_count,
                is_scanned=True,
                warning="Document has no selectable text layer. Processing via scanned optical fallback.",
            )

        return ExtractedDocument(
            raw_text=extracted_text,
            blocks=all_blocks,
            page_count=page_count,
            is_scanned=False,
        )
    finally:
        doc.close()


async def extract_pdf_in_memory(
    content: bytes, allow_scan_fallback: bool = False, timeout_seconds: float = 10.0
) -> ExtractedDocument:
    """Async wrapper executing in-memory PDF extraction under a thread pool timeout."""
    loop = asyncio.get_running_loop()
    try:
        return await asyncio.wait_for(
            loop.run_in_executor(_executor, _parse_pdf_sync, content, allow_scan_fallback),
            timeout=timeout_seconds,
        )
    except TimeoutError as exc:
        raise PDFExtractionError(
            code="PARSER_TIMEOUT",
            message="PDF parsing timed out. Please simplify complex vector layouts or tables.",
        ) from exc

import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";

/**
 * Parses a line of text, splitting it by markdown bold markers (**) 
 * and returning an array of docx TextRun elements.
 */
function parseMarkdownRuns(line: string, isItalic = false, defaultSize = 26): TextRun[] {
  const parts = line.split("**");
  const runs: TextRun[] = [];
  
  parts.forEach((part, index) => {
    if (!part) return;
    
    // Odd indices are bold text because they are enclosed between **
    const isBold = index % 2 === 1;
    runs.push(new TextRun({
      text: part,
      bold: isBold,
      italics: isItalic,
      font: "Times New Roman",
      size: defaultSize, // 26 half-points = 13pt (standard Vietnamese size)
    }));
  });

  return runs;
}

export async function exportToDocx(title: string, fullText: string): Promise<Blob> {
  const lines = fullText.split("\n");
  const children: Paragraph[] = [];

  // Add document title
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240, before: 120 },
      children: [
        new TextRun({
          text: title.toUpperCase() || "ĐỀ CƯƠNG ÔN TẬP TOÁN THEO CHƯƠNG",
          bold: true,
          font: "Times New Roman",
          size: 32, // 16pt
        }),
      ],
    })
  );

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      // Empty line -> spacing
      children.push(
        new Paragraph({
          spacing: { after: 120 },
          children: []
        })
      );
      return;
    }

    // Determine heading levels or list items
    // Case 1: Roman numerals sections (I, II, III, IV, V, VI...) or markdown H1/H2
    const romanMatch = trimmed.match(/^(I|II|III|IV|V|VI|VII|VIII|IX|X)\.\s+(.*)/);
    const hashMatch = trimmed.match(/^#+\s+(.*)/);

    if (romanMatch) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 120 },
          children: [
            new TextRun({
              text: romanMatch[0],
              bold: true,
              font: "Times New Roman",
              size: 28, // 14pt
              color: "000000"
            }),
          ],
        })
      );
    } else if (hashMatch) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 180, after: 100 },
          children: [
            new TextRun({
              text: hashMatch[1],
              bold: true,
              font: "Times New Roman",
              size: 26, // 13pt
              color: "000000"
            }),
          ],
        })
      );
    } 
    // Case 2: Sub-sections like "Dạng 1:" or "Dạng 2:" or lines starting with "Dạng"
    else if (trimmed.startsWith("Dạng ") || trimmed.startsWith("**Dạng ")) {
      children.push(
        new Paragraph({
          spacing: { before: 140, after: 80 },
          children: parseMarkdownRuns(line, false, 26),
        })
      );
    }
    // Case 3: Sub-sections like "1. Phương pháp giải", "2. Ví dụ minh họa", "3. Bài tập tự luyện"
    else if (trimmed.match(/^\d+\.\s+/)) {
      children.push(
        new Paragraph({
          spacing: { before: 100, after: 60 },
          indent: { left: 240 }, // Indent standard subheadings slightly
          children: parseMarkdownRuns(line, false, 26),
        })
      );
    }
    // Case 4: Bullet list items starting with - or *
    else if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
      const content = trimmed.substring(1).trim();
      children.push(
        new Paragraph({
          spacing: { after: 60 },
          bullet: { level: 0 },
          children: parseMarkdownRuns(content, false, 26),
        })
      );
    }
    // Default: regular paragraph
    else {
      children.push(
        new Paragraph({
          spacing: { after: 80 },
          alignment: AlignmentType.JUSTIFIED,
          children: parseMarkdownRuns(line, false, 26),
        })
      );
    }
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: children,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

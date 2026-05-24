const demoPdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 161 >>
stream
BT
/F1 24 Tf
72 720 Td
(JJ Hospital Demo Record) Tj
0 -36 Td
/F1 14 Tf
(This is a dummy PDF used for upload, view, and download UX demos.) Tj
0 -24 Td
(Patient: Demo Patient) Tj
0 -20 Td
(Doctor: Dr. Demo) Tj
0 -20 Td
(Record ID: DEMO-0001) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000241 00000 n 
0000000311 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
524
%%EOF
`

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const download = searchParams.get("download") === "1"

  return new Response(demoPdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="jj-hospital-demo-record.pdf"`,
      "Cache-Control": "no-store",
    },
  })
}

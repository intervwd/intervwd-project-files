// const generatePDF = async (filePath, candidateName, evaluationsData, transcriptionTest, jobTitle, interviewId) => {
//   return new Promise((resolve, reject) => {
//     const doc = new PDFDocument({ margin: 40 });
//     const writeStream = fs.createWriteStream(filePath);
//     doc.pipe(writeStream);

//     // -------------------------------
//     // Page 1: Evaluation (on top)
//     // -------------------------------
//     doc.fontSize(14).fillColor("#000").text(`Candidate Evaluation`, { align: "center" }).moveDown();

//     doc.font('Helvetica-Bold')
//       .fontSize(12)
//       .text(`Job Seeker Name: ${candidateName}`, { align: "left" })
//       .moveDown(0.5);

//     // Job Title
//     doc.font('Helvetica-Bold')
//       .text(`Job Title: ${jobTitle}`, { align: "left" })
//       .moveDown(0.5);

//     // Interview ID
//     doc.font('Helvetica-Bold')
//       .text(`Interview ID: ${interviewId}`, { align: "left" })
//       .moveDown(1);


//     const evaluations = evaluationsData;

//     const col1 = 50,
//       col2 = 250,
//       col3 = 360;
//     const rowHeight = 16; // spacing between rows

//     // Header
//     const headerY = doc.y;
//     doc.font("Helvetica-Bold").fontSize(11)
//       .text("Parameter", col1, headerY, { width: 190 })
//       .text("Score", col2, headerY, { width: 60 })
//       .text("Notes / Justification", col3, headerY, { width: 180 });

//     doc.moveDown(0.5);
//     doc.moveTo(col1, doc.y).lineTo(550, doc.y).strokeColor("#aaa").stroke();

//     // Rows
//     let rowY = doc.y + 6;
//     doc.font("Helvetica").fontSize(10);

//     evaluations.forEach(row => {
//       // Split long text into multiple lines for Notes column
//       const notesLines = doc.heightOfString(row.notes, { width: 180 }) / 10; // approximate
//       doc.text(row.parameter, col1, rowY, { width: 190 });
//       doc.text(row.score, col2, rowY, { width: 60 });
//       doc.text(row.notes, col3, rowY, { width: 180 });

//       rowY += rowHeight * Math.ceil(notesLines); // move Y for next row
//     });

//     doc.moveDown(1.5);
//     doc.font("Helvetica-Bold").fillColor("#0b6efd").fontSize(11).text("Overall Interpretation:").moveDown(0.3);
//     doc.font("Helvetica").fillColor("#000").fontSize(10).text(
//       "John Doe demonstrated strong technical and analytical capabilities suitable for the Software Developer role."
//     );


//     // -------------------------------
//     // Page 2: Full Transcription
//     // -------------------------------
//     doc.addPage();
//     doc.fontSize(14).fillColor("#000").text("Full Interview Transcription", { align: "center" }).moveDown();

//     const transcription = transcriptionTest;

//     doc.end();

//     writeStream.on("finish", resolve);
//     writeStream.on("error", reject);
//   });
// };
// const generatePDF = async (filePath, candidateName, evaluationsData, transcriptionText, jobTitle, interviewId, overAllInterpretation) => {
//   return new Promise((resolve, reject) => {
//     const doc = new PDFDocument({ margin: 40 });
//     const writeStream = fs.createWriteStream(filePath);
//     doc.pipe(writeStream);

//     // -------------------------------
//     // Page 1: Evaluation
//     // -------------------------------
//     doc.fontSize(14).fillColor("#000").text(`Candidate Evaluation`, { align: "center" }).moveDown(0.8);

//     // Basic info
//     doc.font("Helvetica-Bold").fontSize(12);
//     doc.text(`Job Seeker Name: ${candidateName}`, { align: "left" });
//     doc.text(`Job Title: ${jobTitle}`, { align: "left" });
//     doc.text(`Interview ID: ${interviewId}`, { align: "left" });
//     doc.moveDown(0.8);

//     const evaluations = evaluationsData;
//     const col1 = 50,
//       col2 = 250,
//       col3 = 360;
//     const colWidths = { parameter: 190, score: 60, notes: 180 };
//     const lineGap = 6; // controls vertical space

//     // Header
//     const headerY = doc.y;
//     doc.font("Helvetica-Bold").fontSize(11);
//     doc.text("Parameter", col1, headerY, { width: colWidths.parameter });
//     doc.text("Score", col2, headerY, { width: colWidths.score });
//     doc.text("Notes / Justification", col3, headerY, { width: colWidths.notes });

//     doc.moveTo(col1, doc.y + 5).lineTo(550, doc.y + 5).strokeColor("#aaa").stroke();
//     let y = doc.y + 10;

//     // Rows
//     doc.font("Helvetica").fontSize(10).fillColor("#000");
//     evaluations.forEach(row => {
//       const noteHeight = doc.heightOfString(row.notes, { width: colWidths.notes });
//       const cellHeight = Math.max(14, noteHeight + lineGap);

//       // Print row text
//       doc.text(row.parameter, col1, y, { width: colWidths.parameter });
//       doc.text(row.score, col2, y, { width: colWidths.score });
//       doc.text(row.notes, col3, y, { width: colWidths.notes });

//       // Draw horizontal separator
//       y += cellHeight;
//       doc.moveTo(col1, y).lineTo(550, y).strokeColor("#eee").stroke();
//       y += 2.5;
//     });

//     // Move down slightly after the table
//     doc.y = y + 15;

//     // Overall Interpretation
//     doc.font("Helvetica-Bold")
//       .fillColor("#0b6efd")
//       .fontSize(11)
//       .text("Overall Interpretation:", { align: "left" });

//     doc.moveDown(0.4);

//     doc.font("Helvetica")
//       .fillColor("#000")
//       .fontSize(10)
//       .text(
//         `${overAllInterpretation}`, { align: "left" }
//       );

//     // -------------------------------
//     // Page 2: Full Transcription
//     // -------------------------------
//     doc.addPage();
//     doc.fontSize(14).fillColor("#000").text("Full Interview Transcription", { align: "center" }).moveDown();

//     // Add transcription text (if any)
//     if (transcriptionText && typeof transcriptionText === "string") {
//       doc.font("Helvetica").fontSize(10).fillColor("#000").text(transcriptionText, {
//         align: "justify",
//         lineGap: 3,
//       });
//     }

//     doc.end();
//     writeStream.on("finish", resolve);
//     writeStream.on("error", reject);
//   });
// };

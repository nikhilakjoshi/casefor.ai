import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * Generate a PDF from HTML content
 * @param html - HTML string to convert to PDF
 * @param title - Title for the PDF document
 * @returns Promise<Blob> - PDF as a blob
 */
export async function generatePdfFromHtml(
  html: string,
  title: string = "Document"
): Promise<Blob> {
  try {
    // Create a temporary container to render the HTML
    const container = document.createElement("div");
    container.innerHTML = html;
    container.style.width = "210mm"; // A4 width
    container.style.padding = "20mm";
    container.style.fontFamily = "Arial, sans-serif";
    container.style.fontSize = "12pt";
    container.style.lineHeight = "1.6";
    container.style.color = "#000";
    container.style.backgroundColor = "#fff";
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "0";

    document.body.appendChild(container);

    // Convert HTML to canvas
    const canvas = await html2canvas(container, {
      scale: 2, // Higher quality
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    // Remove temporary container
    document.body.removeChild(container);

    // Calculate PDF dimensions
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    // Create PDF
    const pdf = new jsPDF("p", "mm", "a4");
    let position = 0;

    // Add image to PDF
    const imgData = canvas.toDataURL("image/png");
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if content exceeds one page
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Convert to blob
    const blob = pdf.output("blob");
    return blob;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Failed to generate PDF");
  }
}

/**
 * Generate a PDF from HTML element
 * @param element - HTML element to convert to PDF
 * @param title - Title for the PDF document
 * @returns Promise<Blob> - PDF as a blob
 */
export async function generatePdfFromElement(
  element: HTMLElement,
  title: string = "Document"
): Promise<Blob> {
  try {
    // Convert element to canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    // Calculate PDF dimensions
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    // Create PDF
    const pdf = new jsPDF("p", "mm", "a4");
    let position = 0;

    // Add image to PDF
    const imgData = canvas.toDataURL("image/png");
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if content exceeds one page
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Convert to blob
    const blob = pdf.output("blob");
    return blob;
  } catch (error) {
    console.error("Error generating PDF from element:", error);
    throw new Error("Failed to generate PDF");
  }
}

/**
 * Download PDF file
 * @param blob - PDF blob
 * @param filename - Filename for download
 */
export function downloadPdf(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

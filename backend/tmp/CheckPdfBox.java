import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDRectangle;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.interactive.annotation.PDAnnotation;
import org.apache.pdfbox.pdmodel.interactive.form.PDAcroForm;
import org.apache.pdfbox.pdmodel.interactive.form.PDField;
import java.io.File;
import java.util.List;

public class CheckPdfBox {
    public static void main(String[] args) throws Exception {
        PDDocument doc = PDDocument.load(new File("c:/Users/Usuario/Desktop/gestion-ingenieria-v2/backend/src/main/resources/plantilla_legalizacion.pdf"));
        System.out.println("Total pages: " + doc.getNumberOfPages());
        
        for (int i = 0; i < doc.getNumberOfPages(); i++) {
            PDPage page = doc.getPage(i);
            PDRectangle mediaBox = page.getMediaBox();
            System.out.println("Page " + i + ": width=" + mediaBox.getWidth() + " height=" + mediaBox.getHeight());
            
            List<PDAnnotation> annotations = page.getAnnotations();
            System.out.println("  Annotations on page " + i + ": " + annotations.size());
            for (PDAnnotation ann : annotations) {
                PDRectangle rect = ann.getRectangle();
                if (rect != null) {
                    System.out.println("  Annotation rect: x=" + rect.getLowerLeftX() + " y=" + rect.getLowerLeftY() + " w=" + rect.getWidth() + " h=" + rect.getHeight() + " type=" + ann.getSubtype());
                }
            }
        }
        
        // Check form fields
        PDAcroForm acroForm = doc.getDocumentCatalog().getAcroForm();
        if (acroForm != null) {
            System.out.println("\nForm fields:");
            for (PDField field : acroForm.getFieldTree()) {
                System.out.println("  Field: " + field.getFullyQualifiedName() + " type=" + field.getClass().getSimpleName());
            }
        }
        doc.close();
    }
}

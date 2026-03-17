
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.interactive.form.PDAcroForm;
import org.apache.pdfbox.pdmodel.interactive.form.PDField;
import java.io.File;

public class CheckFields {
    public static void main(String[] args) {
        try {
            PDDocument doc = PDDocument.load(new File("c:/Users/Usuario/Desktop/gestion-ingenieria-v2/backend/src/main/resources/CERTIFICADO 1699 firmado.pdf"));
            PDAcroForm acroForm = doc.getDocumentCatalog().getAcroForm();
            if (acroForm != null) {
                for (PDField field : acroForm.getFields()) {
                    System.out.println("Field: " + field.getFullyQualifiedName());
                }
            } else {
                System.out.println("No AcroForm found.");
            }
            doc.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

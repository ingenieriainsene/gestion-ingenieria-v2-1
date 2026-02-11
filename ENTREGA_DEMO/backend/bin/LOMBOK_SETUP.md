# Lombok Setup for Eclipse

If you are seeing errors like `The constructor is undefined`, `getters/setters missing`, or `log cannot be resolved`, it means the Lombok agent is not installed in your Eclipse IDE.

## Steps to Install Lombok:

1.  **Download Lombok**:
    The `lombok.jar` is already downloaded by Maven. You can find it in your local repository:
    `C:\Users\<Usuario>\.m2\repository\org\projectlombok\lombok\<version>\lombok-<version>.jar`
    
    Or verify the path by running: `mvn dependency:list`

2.  **Run the Installer**:
    - Close Eclipse.
    - Open a terminal/command prompt.
    - Run the jar: `java -jar path\to\lombok.jar`
    - A GUI installer will open. It should auto-detect your Eclipse installation.
    - If it doesn't, click "Specify location" and point it to your `eclipse.ini` file.
    - Click **"Install / Update"**.

3.  **Verify Configuration**:
    - Open your `eclipse.ini` file (usually in the Eclipse installation folder).
    - Ensure the following line exists at the end:
      `-javaagent:path\to\lombok.jar`

4.  **Restart Eclipse**:
    - Launch Eclipse.
    - Clean the project: `Project > Clean... > Clean all projects`.
    - Right-click project > `Maven > Update Project`.

Your compilation errors related to Lombok annotations should now disappear.

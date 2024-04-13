# Embedding Custom Files in PNG Files
Embed a file within the hidden space of a PNG file or extract it. This technique allows you to store all the settings of your application within preview images. As it is a PNG file, every web browser and operating system can directly display the preview related to the application settings.

# Installation
Node.js must be installed on the system.

# Embedding a File
To embed a file, use the following command:
```bash
node dist/index.js -i "input.png" -o "output.png" -d "arbitraryDataFile"
```

# Extracting a File
To extract a file, use the following command:
```bash
node dist/index.js -i "input.png" -o "output.filetype"
```
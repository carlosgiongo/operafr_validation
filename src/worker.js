const operaUploaderLib = require("operafr");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

async function main() {
    const authToken = await fetch("http://147.79.83.77:2111/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: "carlosgiongo",
            password: "12345678"

        })
    })
    const authTokenJson = await authToken.json();

    const operaUploader = await operaUploaderLib.instantiate({
        serverUrl: "147.79.83.77",
        token: authTokenJson.content.token,
        requestPort: 5555,
        publishPort: 5556,
        verbose: true
    });

    const mediaDir = path.join(process.cwd(), 'src/pages/api/media');
    const hashesDir = path.join(process.cwd(), 'src/pages/api/hashes');

    if (!fs.existsSync(hashesDir)) {
        fs.mkdirSync(hashesDir);
    }

    fs.readdir(mediaDir, async (err, files) => {
        if (err) {
            console.error("Erro ao ler a pasta:", err);
            return;
        }

        for (const file of files) {
            const filePath = path.join(mediaDir, file);

            try {
                const initialParams = await operaUploader.allocate(filePath, { 
                    publicUrl: true,
                    folderId: 4
                });

                const fileContent = fs.readFileSync(filePath);
                const hash = crypto.createHash("sha256").update(fileContent).digest("hex");
                const hashFilePath = path.join(hashesDir, file + ":" + initialParams.publicUrl + ".hash");                 
                fs.writeFileSync(hashFilePath, hash);

                operaUploader.upload(initialParams.systemFilename, filePath, {chunckSize: (1024 * 1024) * 25}); 
                console.log(`Arquivo ${file} enviado com sucesso! Hash: ${hash}`);
            } catch (error) {
                console.error(`Erro ao processar o arquivo ${file}:`, error);
            }
        }
    });
}

main();
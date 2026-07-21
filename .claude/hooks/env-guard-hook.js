
async function main(){
    const chunks = [];

    for await (const chunk of process.stdin) {
        chunks.push(chunk);
    }

    /** @type {{ tool_input?: { file_path?: string, path?: string } }} */
    const toolArgs = JSON.parse(Buffer.concat(chunks).toString());
    const input = toolArgs.tool_input || {};

    const targetPath = input.file_path || input.path || "";
    const fileName = targetPath.split(/[\\/]/).pop() || "";
    if (fileName === ".env"){
        console.error("You cannot read, write or edit the .env file!");
        process.exit(2);
    }

    const command = input.command || "";
    if (/(^|[\\/\s])\.env($|[\s"'])/.test(command)){
        console.error("You cannot reference the .env file in the bash commands");
        process.exit(2);
    }

    process.exit(0);
}

main().catch((err) => {
    console.error("env guard hook failed: ", err.message);
    process.exit(1);
});
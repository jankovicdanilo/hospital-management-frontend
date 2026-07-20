import * as stream from "node:stream";

async function main(){
    const chunks = [];

    for await (const chunk of process.stdin) {
        chunks.push(chunk);
    }

    const toolArgs = JSON.parse(Buffer.concat(chunks).toString());
    const readPath = toolArgs.tool_input?.file_path || toolArgs.tool_input?.path || "";

    const fileName = readPath.split(/[\\/]/).pop() || "";
    if(fileName === ".env"){
        console.error("You cannot read the .env file!");
        process.exit(2);
    }

    process.exit(0);
}

main();
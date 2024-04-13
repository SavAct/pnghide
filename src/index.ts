import * as fs from 'fs';
import { PNG } from 'pngjs';
import * as yargs from 'yargs';
import { crc32 } from 'crc';

// Define the command line arguments
const argv = yargs.options({
    data: {
        type: 'string',
        alias: 'd',
        describe: 'Path to the data file (unset for extraction)',
    },
    input: {
        type: 'string',
        demandOption: true,
        default: 'input.png',
        alias: 'i',
        describe: 'Path to input PNG file',
    },
    output: {
        type: 'string',
        demandOption: true,
        default: 'output',
        alias: 'o',
        describe: 'Path to output file (PNG or data depending on operation)',
    },
}).argv;

function createPrivateChunk(dataBuffer: Buffer): Buffer {
    const type = Buffer.from('prVt');
    const length = Buffer.alloc(4);
    length.writeUInt32BE(dataBuffer.length, 0);
    const crcBuffer = Buffer.concat([type, dataBuffer]);
    const crcValue = crc32(crcBuffer);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crcValue, 0);
    return Buffer.concat([length, type, dataBuffer, crc]);
}

function extractDataFromChunk(pngBuffer: Buffer): Buffer | null {
    let offset = 8; // PNG header is 8 bytes
    while (offset < pngBuffer.length) {
        const length = pngBuffer.readUInt32BE(offset);
        const type = pngBuffer.toString('ascii', offset + 4, offset + 8);
        if (type === 'prVt') {
            return pngBuffer.subarray(offset + 8, offset + 8 + length);
        }
        offset += length + 12; // Move past the current chunk (length + type + data + CRC)
    }
    return null;
}

function addDataToPNG(
    dataFilePath: string,
    inputPngPath: string,
    outputPngPath: string,
): void {
    fs.readFile(dataFilePath, (err, dataBuffer) => {
        if (err) throw err;

        fs.createReadStream(inputPngPath)
            .pipe(new PNG())
            .on('parsed', function () {
                const privateChunk = createPrivateChunk(dataBuffer);
                const pngBuffer = PNG.sync.write(this);
                const finalBuffer = Buffer.concat([
                    pngBuffer.subarray(0, -12),
                    privateChunk,
                    pngBuffer.subarray(-12),
                ]);
                fs.writeFileSync(outputPngPath, finalBuffer);
                console.log(
                    `Private chunk added and PNG saved as ${outputPngPath}`,
                );
            });
    });
}

function extractData(inputPngPath: string, outputPath: string): void {
    fs.readFile(inputPngPath, (err, pngBuffer) => {
        if (err) throw err;

        const data = extractDataFromChunk(pngBuffer);
        if (data) {
            fs.writeFileSync(outputPath, data);
            console.log(`Data extracted and saved as ${outputPath}`);
        } else {
            console.log(`No private chunk found in ${inputPngPath}`);
        }
    });
}

if ('data' in argv && argv.data) {
    if (!argv.output.endsWith('.png') || argv.output.endsWith('.PNG')) {
        argv.output += '.png';
    }

    addDataToPNG(argv.data, argv.input, argv.output);
} else {
    if ('input' in argv && argv.input && 'output' in argv && argv.output) {
        extractData(argv.input, argv.output);
    }
}

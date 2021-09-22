/**
 * MK File
 * create file using mkfile
 *
 * @author biati-digital
 */
function mkFile(filePath, size) {
    return new Promise((resolve, reject) => {
        const docurl = new Process('/usr/bin/env', {
            args: ['mkfile', '-n', size.toString(), filePath]
        });
        let stdOut = '';
        let stdErr = '';
        docurl.onStdout((result) => {
            stdOut += result;
        });
        docurl.onStderr((line) => {
            stdErr += line;
        });
        docurl.onDidExit((status) => {
            if (status === 0) {
                resolve(stdOut);
            } else {
                reject(stdErr);
            }
        });
        docurl.start();
    });
}

/**
 * Compress file
 * used to compress the file
 * in multiple formats
 */
function compressFile(command) {
    return new Promise((resolve, reject) => {
        const docurl = new Process('/usr/bin/env', {
            args: command
        });
        let stdOut = '';
        let stdErr = '';
        docurl.onStdout((result) => {
            stdOut += result;
        });
        docurl.onStderr((line) => {
            stdErr += line;
        });
        docurl.onDidExit((status) => {
            if (status === 0) {
                resolve(stdOut);
            } else {
                reject(stdErr);
            }
        });
        docurl.start();
    });
}

/**
 * Zip File
 *
 * @param {string} filePath
 * @param {string} outputFile
 */
function zipFile(filePath, outputFile) {
    return new Promise((resolve, reject) => {
        const docurl = new Process('/usr/bin/env', {
            args: ['zip', '-m', '-0', outputFile, filePath]
        });
        let stdOut = '';
        let stdErr = '';
        docurl.onStdout((result) => {
            stdOut += result;
        });
        docurl.onStderr((line) => {
            stdErr += line;
        });
        docurl.onDidExit((status) => {
            if (status === 0) {
                resolve(stdOut);
            } else {
                reject(stdErr);
            }
        });
        docurl.start();
    });
}

/**
 * Dumy file
 *
 * @param {string} filePath
 * @param {string} fileName
 * @param {string} size
 * @returns {Promise}
 */
export async function dummyFile(filePath, fileName, size) {
    if (!filePath) {
        throw new Error('File path must be provided');
    }
    if (!fileName) {
        throw new Error('File name must be provided');
    }

    size = size.toLowerCase().replace(/\s/g, '').replace(/,/, '');
    size = size.replace(/([0-9.]+)(gigabytes|gigas|giga|gbs|gb)/i, (r1, r2) => {
        return r2 + 'gb';
    });
    size = size.replace(/([0-9.]+)(megabytes|megabyte|mbs|mb)/i, (r1, r2) => {
        return r2 + 'mb';
    });
    size = size.replace(/([0-9.]+)(kilobytes|kilobyte|kbs|kb)/i, (r1, r2) => {
        return r2 + 'kb';
    });
    size = size.replace(/([0-9.]+)(bytes|byte|bs|b)/i, (r1, r2) => {
        return r2;
    });

    const bMatch = size.match(/^(\d+)$/i);
    const kbMatch = size.match(/^(\d+)kb$/i);
    const mbMatch = size.match(/^(\d+)mb/i);
    const gbMatch = size.match(/^(\d+)gb/i);

    let isZip = false;
    let isTar = false;

    // Handle Zip files
    if (fileName.endsWith('.zip')) {
        isZip = nova.path.join(filePath, fileName);
        fileName = fileName.replace('.zip', '.txt');
    }
    // Handle Tar files
    if (fileName.endsWith('.tar')) {
        isTar = nova.path.join(filePath, fileName);
        fileName = fileName.replace('.tar', '.txt');
    }

    filePath = nova.path.join(filePath, fileName);

    if (bMatch) {
        size = +bMatch[1];
    }
    if (kbMatch) {
        size = +kbMatch[1] * 1000;
    }
    if (mbMatch) {
        size = +mbMatch[1] * 1000 * 1000;
    }
    if (gbMatch) {
        size = +gbMatch[1] * 1000 * 1000 * 1000;
    }

    if (size < 0) {
        throw new Error('File size must be provided');
    }

    mkFile(filePath, size)
        .then((res) => {
            if (isZip) {
                return compressFile(['zip', '-m', '-0', isZip, filePath]);
            }
            if (isTar) {
                return compressFile(['tar', '-cf', isTar, filePath]);
            }
            return true;
        })
        .then(() => {
            return true;
        })
        .catch((error) => {
            console.error(error);
        });
}

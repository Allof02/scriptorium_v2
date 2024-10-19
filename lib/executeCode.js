import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const PYTHON_PATH = '/usr/bin/python3';
const NODE_PATH = '/usr/bin/node';
const GCC_PATH = '/usr/bin/gcc';
const GPP_PATH = '/usr/bin/g++';
const JAVAC_PATH = '/usr/bin/javac';
const JAVA_PATH = '/usr/bin/java';

export async function executeCode({ code, language, stdin }) {
  return new Promise((resolve, reject) => {
    const tempDir = path.join('/tmp', 'scriptorium'); // Use '/tmp/scriptorium' directory
    if (!fs.existsSync(tempDir)) { 
      fs.mkdirSync(tempDir, { recursive: true }); //Create tmp/scriptorium if it does not exist. (recursive: other path are automatically created  if not existed)
    }

    const filename = uuidv4(); // Generate a unique filename

    let fileExtension = ''; //.py, .c, .cpp, .java ...
    let command = ''; // python, node, gcc, g++, javac ...
    let args = []; // Arguments to pass to the command

    // find appropriate command and file extension based on the language
    switch (language.toLowerCase()) {
      case 'python':
        fileExtension = '.py';
        command = PYTHON_PATH;
        break;
      case 'javascript':
        fileExtension = '.js';
        command = NODE_PATH;
        break;
      case 'c':
        fileExtension = '.c';
        command = GCC_PATH;
        break;
      case 'cpp':
        fileExtension = '.cpp';
        command = GPP_PATH;
        break;
      case 'java':
        fileExtension = '.java';
        command = JAVAC_PATH;
        break;
      default:
        return reject(new Error('Unsupported language')); // Sorry we don't support this language ^_^ because we sucks :(
    }

    // Create path name like: /tmp/scriptorium/unique-id.py
    const sourceFile = path.join(tempDir, `${filename}${fileExtension}`);

    // Write the code to a file
    fs.writeFileSync(sourceFile, code);

    // Ok, easy language time
    if (['python', 'javascript'].includes(language.toLowerCase())) {
      // Interpreted languages
      args = [sourceFile];

      // YOU SHALL NEVER FORK BOMB MY PC 
      const process = spawn(command, args, { timeout: 5000 });

      let stdout = '';
      let stderr = '';

      if (stdin) {
        // Feed the stdin to the process
        process.stdin.write(stdin);
      }
      // No more sir
      process.stdin.end();

      // Listen to the stdout, stderr and close event
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      // Listens for the close event, triggered when the process exits.
      process.on('close', (exitCode) => {
        // Delete the source file (my SSDs aren't that large as you expected :D)
        fs.unlinkSync(sourceFile);

        resolve({
          stdout,
          stderr,
          exitCode,
        });
      });

      // Your process is dead.
      process.on('error', (err) => {
        // Delete the source file
        fs.unlinkSync(sourceFile);

        reject(err);
      });
    
      // the worst languages ever Segmentation fault Segmentation fault Segmentation fault Segmentation fault Segmentation fault
      // Segmentation fault Segmentation fault Segmentation fault Segmentation fault Segmentation fault Segmentation fault Segmentation fault 
      // Segmentation fault Segmentation fault Segmentation fault Segmentation fault Segmentation fault Segmentation fault Segmentation fault
    } else if (['c', 'cpp', 'java'].includes(language.toLowerCase())) {
      let compileCommand = '';
      let executable = '';

      if (language.toLowerCase() === 'c' || language.toLowerCase() === 'cpp') {
        // Compile the code

        // ex: ...xxx.out
        executable = path.join(tempDir, `${filename}.out`);
        compileCommand = command; // gcc or g++

        // ex: gcc or g++ xxx.c -o xxx.out
        // Compile the code
        const compileProcess = spawn(compileCommand, [sourceFile, '-o', executable]);

        let compileStderr = '';

        // Listen to the stderr and close event
        compileProcess.stderr.on('data', (data) => {
          compileStderr += data.toString();
        });

        compileProcess.on('close', (compileExitCode) => {
          if (compileExitCode !== 0) {
            // Bruh, your code cannot even pass the compilation stage
            // See you ~
            fs.unlinkSync(sourceFile);

            return resolve({
              stdout: '',
              stderr: compileStderr,
              exitCode: compileExitCode,
            });
          }

          // Execute the compiled binary
          const execProcess = spawn(executable, [], { timeout: 5000 });

          let stdout = '';
          let stderr = '';

          if (stdin) {
            execProcess.stdin.write(stdin);
          }
          execProcess.stdin.end();

          execProcess.stdout.on('data', (data) => {
            stdout += data.toString();
          });

          execProcess.stderr.on('data', (data) => {
            stderr += data.toString();
          });

          execProcess.on('close', (exitCode) => {
            // Clean up temp files
            fs.unlinkSync(sourceFile);
            fs.unlinkSync(executable);

            resolve({
              stdout,
              stderr,
              exitCode,
            });
          });

          execProcess.on('error', (err) => {
            // Clean up temp files
            fs.unlinkSync(sourceFile);
            fs.unlinkSync(executable);

            reject(err);
          });
        });

      } else if (language.toLowerCase() === 'java') {
        // Thanks to Chatgpt, it's been thousands of years since I last ran Java code

        // Naming validation? GPT magic :D
        const className = `Main${filename.replace(/-/g, '')}`; 
        const javaSourceFile = path.join(tempDir, `${className}.java`);
        const javaCode = code.replace(/public\s+class\s+Main/, `public class ${className}`);

        // My magic 
        fs.writeFileSync(javaSourceFile, javaCode);

        const compileProcess = spawn(command, [javaSourceFile]); 

        let compileStderr = '';

        compileProcess.stderr.on('data', (data) => {
          compileStderr += data.toString();
        });

        compileProcess.on('close', (compileExitCode) => {
          if (compileExitCode !== 0) {
            fs.unlinkSync(javaSourceFile);

            return resolve({
              stdout: '',
              stderr: compileStderr,
              exitCode: compileExitCode,
            });
          }

          // Still GPT magic
          const execProcess = spawn(JAVA_PATH, ['-cp', tempDir, className], { timeout: 5000 });

          let stdout = '';
          let stderr = '';

          if (stdin) {
            execProcess.stdin.write(stdin);
          }
          execProcess.stdin.end();

          execProcess.stdout.on('data', (data) => {
            stdout += data.toString();
          });

          execProcess.stderr.on('data', (data) => {
            stderr += data.toString();
          });

          execProcess.on('close', (exitCode) => {
            // Clean up temp files
            fs.unlinkSync(javaSourceFile);
            fs.readdirSync(tempDir).forEach((file) => {
              if (file.endsWith('.class')) {
                fs.unlinkSync(path.join(tempDir, file));
              }
            });

            resolve({
              stdout,
              stderr,
              exitCode,
            });
          });

          execProcess.on('error', (err) => {
            // Clean up temp files
            fs.unlinkSync(javaSourceFile);
            fs.readdirSync(tempDir).forEach((file) => {
              if (file.endsWith('.class')) {
                fs.unlinkSync(path.join(tempDir, file));
              }
            });

            reject(err);
          });
        });

      }
    } else {
      // Unsupported language
      fs.unlinkSync(sourceFile);
      return reject(new Error('Unsupported language'));
    }
  });
}
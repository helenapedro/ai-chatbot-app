import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { env } from '../config/env.js';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectoryPath = path.dirname(currentFilePath);

const resolvePackageRootPath = () => {
   const candidatePaths = [
      process.cwd(),
      path.resolve(currentDirectoryPath, '..'),
      path.resolve(currentDirectoryPath, '..', '..'),
   ];

   for (const candidatePath of candidatePaths) {
      if (
         fs.existsSync(path.join(candidatePath, 'prompts', 'chatbot.txt')) &&
         fs.existsSync(path.join(candidatePath, 'prompts', 'helenaexplora.md'))
      ) {
         return candidatePath;
      }
   }

   throw new Error('Unable to locate the server prompts directory.');
};

const packageRootPath = resolvePackageRootPath();

const template = fs.readFileSync(
   path.join(packageRootPath, 'prompts', 'chatbot.txt'),
   'utf-8'
);

const projectInfo = fs.readFileSync(
   path.join(packageRootPath, 'prompts', 'helenaexplora.md'),
   'utf-8'
);

const instructions = template
   .replace('{{helenaExploraSiteUrl}}', env.HELENA_EXPLORA_SITE_URL)
   .replace('{{projectInfo}}', projectInfo);

export const promptService = {
   getInstructions() {
      return instructions;
   },
};

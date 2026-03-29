import fs from 'fs';
import path from 'path';

import template from '../prompts/chatbot.txt';

const projectInfo = fs.readFileSync(
   path.join(__dirname, '..', 'prompts', 'helenaexplora.md'),
   'utf-8'
);

const instructions = template.replace('{{projectInfo}}', projectInfo);

export const promptService = {
   getInstructions() {
      return instructions;
   },
};

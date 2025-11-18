import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger le fichier OpenAPI YAML
const openApiPath = join(__dirname, 'openapi.yaml');
const openApiFile = readFileSync(openApiPath, 'utf8');
const specs = yaml.load(openApiFile);

export { specs };
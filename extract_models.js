import fs from 'fs';

// Read the models.json file
const modelsData = JSON.parse(fs.readFileSync('models.json', 'utf8'));

// Extract and format models
const models = modelsData.data.map(model => ({
  id: model.id,
  name: model.name,
  description: model.description,
  context_length: model.context_length,
  pricing: model.pricing,
  input_modalities: model.input_modalities || [],
  supported_features: model.supported_features || []
}));

// Sort models by popularity/name
const sortedModels = models.sort((a, b) => {
  // Prioritize popular models first
  const popularModels = [
    'google/gemini-2.0-flash-001',
    'openai/gpt-4o',
    'openai/gpt-4o-mini',
    'anthropic/claude-3.5-sonnet',
    'meta-llama/llama-3.1-8b-instruct',
    'meta-llama/llama-3.1-70b-instruct',
    'google/gemini-2.5-flash',
    'google/gemini-2.5-flash-lite-preview-06-17'
  ];
  
  const aIndex = popularModels.indexOf(a.id);
  const bIndex = popularModels.indexOf(b.id);
  
  if (aIndex !== -1 && bIndex !== -1) {
    return aIndex - bIndex;
  }
  if (aIndex !== -1) return -1;
  if (bIndex !== -1) return 1;
  
  return a.name.localeCompare(b.name);
});

// Create the formatted output for the React component
const formattedModels = sortedModels.map(model => ({
  value: model.id,
  label: model.name,
  description: model.description,
  contextLength: model.context_length,
  pricing: model.pricing,
  inputModalities: model.input_modalities,
  supportedFeatures: model.supported_features
}));

// Save to a new file
fs.writeFileSync('formatted_models.json', JSON.stringify(formattedModels, null, 2));

console.log(`Extracted ${formattedModels.length} models`);
console.log('First 10 models:');
formattedModels.slice(0, 10).forEach(model => {
  console.log(`- ${model.label} (${model.id})`);
}); 
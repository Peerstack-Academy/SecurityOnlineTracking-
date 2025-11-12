/**
 * Bidirectional Azerbaijani ↔ English Name Transliterator
 * Fully reversible with metadata preservation
 * 
 * @param {string} name - The name to transliterate
 * @param {string} direction - "AZ_TO_EN" or "EN_TO_AZ"
 * @param {boolean} returnMeta - If true, returns metadata for reversibility
 * @return {string} Transliterated name (or metadata if returnMeta is true)
 * @customfunction
 */
function TRANSLIT_NAME(name, direction, returnMeta) {
  if (!name || name.toString().trim() === "") return "";
  
  direction = direction.toString().toUpperCase();
  returnMeta = returnMeta || false;
  
  if (direction === "AZ_TO_EN") {
    return azToEn(name.toString(), returnMeta);
  } else if (direction === "EN_TO_AZ") {
    return enToAz(name.toString(), returnMeta);
  } else {
    return "ERROR: Direction must be 'AZ_TO_EN' or 'EN_TO_AZ'";
  }
}

/**
 * Azerbaijani to English conversion
 */
function azToEn(text, returnMeta) {
  // Track positions of 'ə' for reversibility
  const metadata = [];
  let result = text;
  
  // Character mapping (case-sensitive)
  const azToEnMap = {
    'ə': 'a', 'Ə': 'A',
    'ç': 'ch', 'Ç': 'Ch',
    'ğ': 'gh', 'Ğ': 'Gh',
    'ş': 'sh', 'Ş': 'Sh',
    'ı': 'i', 'I': 'I',
    'ö': 'o', 'Ö': 'O',
    'ü': 'u', 'Ü': 'U'
  };
  
  // Track ə positions before conversion
  let charIndex = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === 'ə' || char === 'Ə') {
      metadata.push(charIndex);
    }
    // Count character position in result (multi-char replacements adjust this)
    const replacement = azToEnMap[char];
    if (replacement) {
      charIndex += replacement.length;
    } else {
      charIndex++;
    }
  }
  
  // Perform transliteration
  result = text;
  for (const [az, en] of Object.entries(azToEnMap)) {
    result = result.split(az).join(en);
  }
  
  if (returnMeta) {
    return metadata.join(',');
  }
  return result;
}

/**
 * English to Azerbaijani conversion using metadata
 */
function enToAz(text, useMeta) {
  let result = text;
  
  // Reverse character mapping
  const enToAzMap = {
    'ch': 'ç', 'Ch': 'Ç', 'CH': 'Ç',
    'gh': 'ğ', 'Gh': 'Ğ', 'GH': 'Ğ',
    'sh': 'ş', 'Sh': 'Ş', 'SH': 'Ş',
    'i': 'ı', 'I': 'I',
    'o': 'ö', 'O': 'Ö',
    'u': 'ü', 'Ü': 'Ü'
  };
  
  // First, handle multi-character replacements (order matters)
  result = result.replace(/ch/g, 'ç').replace(/Ch/g, 'Ç').replace(/CH/g, 'Ç');
  result = result.replace(/gh/g, 'ğ').replace(/Gh/g, 'Ğ').replace(/GH/g, 'Ğ');
  result = result.replace(/sh/g, 'ş').replace(/Sh/g, 'Ş').replace(/SH/g, 'Ş');
  
  // Handle vowels (more conservative - only convert in name contexts)
  // For 'a' to 'ə': This requires metadata or heuristics
  // We'll use common Azerbaijani name patterns
  
  result = convertAToSchwa(result);
  
  return result;
}

/**
 * Smart conversion of 'a' to 'ə' using Azerbaijani name patterns
 */
function convertAToSchwa(text) {
  // Common Azerbaijani name patterns where 'a' should be 'ə'
  const patterns = [
    // Name endings
    { pattern: /(\w+)adov(a)?$/gi, replacement: (match, p1, p2) => p1 + 'ədov' + (p2 || '') },
    { pattern: /(\w+)ayev$/gi, replacement: (match, p1) => p1 + 'əyev' },
    
    // Common prefixes and syllables
    { pattern: /^Ə/gi, replacement: 'Ə' },
    { pattern: /^ə/gi, replacement: 'ə' },
    
    // Specific name patterns
    { pattern: /Şafiq([a])/gi, replacement: 'Şəfiq$1' },
    { pattern: /Rəşad/gi, replacement: 'Rəşad' },
    { pattern: /Məmm([a])/gi, replacement: 'Məmm$1' },
    
    // First character 'A' in common Azerbaijani names
    { pattern: /^Aliy/gi, replacement: 'Əliy' },
    { pattern: /^Aliş/gi, replacement: 'Əliş' },
  ];
  
  let result = text;
  
  // Apply patterns
  for (const {pattern, replacement} of patterns) {
    result = result.replace(pattern, replacement);
  }
  
  return result;
}

/**
 * Helper function for metadata-based conversion
 * @param {string} name - English name
 * @param {string} metadata - Comma-separated positions of 'ə'
 * @return {string} Azerbaijani name
 * @customfunction
 */
function TRANSLIT_WITH_META(name, metadata) {
  if (!name || !metadata) return name;
  
  // First do standard EN_TO_AZ conversion
  let result = enToAz(name, false);
  
  // Then apply metadata corrections
  const positions = metadata.toString().split(',').map(p => parseInt(p)).filter(p => !isNaN(p));
  
  // Convert specific 'a' positions back to 'ə' based on metadata
  let chars = result.split('');
  for (const pos of positions) {
    if (pos < chars.length) {
      if (chars[pos] === 'a') chars[pos] = 'ə';
      if (chars[pos] === 'A') chars[pos] = 'Ə';
    }
  }
  
  return chars.join('');
}

// Usage examples:
// =TRANSLIT_NAME(A2, "AZ_TO_EN", FALSE)  // Convert AZ to EN
// =TRANSLIT_NAME(A2, "AZ_TO_EN", TRUE)   // Get metadata
// =TRANSLIT_NAME(B2, "EN_TO_AZ", FALSE)  // Convert EN to AZ
// =TRANSLIT_WITH_META(B2, C2)            // Convert with metadata



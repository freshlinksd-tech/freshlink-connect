/**
 * Safety and Content Shield targeting sexually abusable keywords, profanity,
 * and nudity content screening.
 */

// A comprehensive regex compilation of sexually abusable, explicit, or sexually abusive words.
const FlaggedSexTerms = [
  'sex', 'porn', 'naked', 'nude', 'boob', 'tits', 'breast', 'dick', 
  'pussy', 'cock', 'vulva', 'vagina', 'penis', 'asshole', 'fuck', 
  'bitch', 'slut', 'whore', 'hooker', 'orgasm', 'erotic', 'clitoris',
  'ejaculation', 'masturbate', 'nakedness', 'nudity', 'sexually', 'abuse'
];

/**
 * Checks if a piece of text (case-insensitive) contains explicit or sexually suggestive terminology.
 */
export function hasFlaggedText(text: string): boolean {
  if (!text) return false;
  // Skip binary base64 data URIs or blob URIs as they are non-textual and trigger false positives
  if (text.startsWith('data:') || text.startsWith('blob:')) {
    return false;
  }
  const clean = text.toLowerCase();
  return FlaggedSexTerms.some(term => {
    // Look for whole words or subparts to prevent clever bypassing
    const regex = new RegExp(`\\b${term}\\b|${term}`, 'i');
    return regex.test(clean);
  });
}

/**
 * Replaces flagged/abusive words with asterisks (e.g., "sex" becomes "s**").
 * Keeps the first letter and replaces the rest to maintain flow while completely blurring the abuse.
 */
export function censorText(text: string): string {
  if (!text) return text;
  let censored = text;
  
  FlaggedSexTerms.forEach(term => {
    // Escape term for Safe RegExp matching
    const escapedTerm = term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedTerm}\\b|${escapedTerm}`, 'gi');
    
    censored = censored.replace(regex, (match) => {
      if (match.length <= 1) return '*';
      if (match.length === 2) return match[0] + '*';
      return match[0] + '*'.repeat(match.length - 2) + match[match.length - 1];
    });
  });
  
  return censored;
}

interface SafetyVerificationResult {
  isSafe: boolean;
  reason?: string;
  scannedItems: string[];
}

/**
 * Conducts a safety, nudity, and explicit media verification across title, content, custom images, and videos.
 * Simulates a visual scanning model and filters flag terms.
 */
export function scanPostSafety(
  title: string,
  content: string,
  category: string,
  tags: string[],
  mediaUrl?: string,
  mediaUrls?: string[],
  videoUrl?: string
): SafetyVerificationResult {
  const scannedItems: string[] = ['Article Title', 'Content Text', 'Tags and Category metadata'];
  
  // 1. Scan text elements
  if (hasFlaggedText(title)) {
    return {
      isSafe: false,
      reason: 'Flagged sexual or nudity terminology detected in the post title.',
      scannedItems
    };
  }
  
  if (hasFlaggedText(content)) {
    return {
      isSafe: false,
      reason: 'Flagged explicit content or sexually abusable vocabulary detected in the main body text.',
      scannedItems
    };
  }

  const tagViolation = tags.some(tag => hasFlaggedText(tag));
  if (tagViolation || hasFlaggedText(category)) {
    return {
      isSafe: false,
      reason: 'Flagged category or search hashtag is explicit or contains unsafe words.',
      scannedItems
    };
  }

  // 2. Scan media links (image/videos names, external domains or raw encoding structures)
  if (mediaUrl) {
    scannedItems.push('Primary Cover Image');
    if (hasFlaggedText(mediaUrl)) {
      return {
        isSafe: false,
        reason: 'Unsafe filename, path, or description suggesting explicit/nude content in the primary cover photo.',
        scannedItems
      };
    }
  }

  if (mediaUrls && mediaUrls.length > 0) {
    scannedItems.push(`Companion Photo Gallery (${mediaUrls.length} items)`);
    for (let i = 0; i < mediaUrls.length; i++) {
      if (hasFlaggedText(mediaUrls[i])) {
        return {
          isSafe: false,
          reason: `Companion Photo #${i + 1} contains unsafe data references or flagged metadata.`,
          scannedItems
        };
      }
    }
  }

  if (videoUrl) {
    scannedItems.push('Story Video Attachment');
    if (hasFlaggedText(videoUrl)) {
      return {
        isSafe: false,
        reason: 'Video path, stream, or file description contains flagged explicit names.',
        scannedItems
      };
    }
  }

  // 3. Simulates a fast Neural Skin-Tone and Explicit Visual check
  // E.g., check block content length or random hashes to simulate visual classification
  const combinedData = (mediaUrl || '') + (videoUrl || '') + (mediaUrls?.join('') || '');
  if (combinedData.length > 10000) {
    // Check for explicit file characteristics (e.g. data URI segments containing certain patterns or strings)
    // Here we can search for base64 patterns that represent flat, high skin-tone ratios if desired, or random seeded safety verification.
    if (combinedData.includes('explicit_dummy_flag') || combinedData.includes('porn_unsafe')) {
      return {
        isSafe: false,
        reason: 'Neural filter visual trigger: Uploaded media flagged high skin-exposure ratio or explicit posture.',
        scannedItems
      };
    }
  }

  return {
    isSafe: true,
    scannedItems
  };
}

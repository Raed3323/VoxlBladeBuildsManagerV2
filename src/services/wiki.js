const WIKI_BASE = 'https://voxlpedia.miraheze.org'
const API_URL = `${WIKI_BASE}/w/api.php`
const CACHE_KEY = 'voxlpedia-cache-v26'
const CACHE_TTL = 1000 * 60 * 60 * 24 * 7
const MAX_SOURCE_LOOKUPS = 4
const MAX_LOCATION_LOOKUPS = 4

const ENCHANTMENT_PAGE_NAMES = ['Enchantments', 'Enchantment', 'Voxlblade Enchantments']
const INFUSION_PAGE_NAMES = ['Infusions', 'Infusion', 'Voxlblade Infusions']

const ENCHANTMENT_HINTS = [
  'enchant', 'sacrificial', 'contained', 'quick / piercing', 'quick/piercing', 'restored sacrificial',
]

const SLOT_HINTS = [
  'helmet', 'head', 'chestplate', 'chest piece', 'chest armor', 'leggings', 'leg armor',
  'boots', 'gauntlet', 'gloves', 'ring', 'amulet', 'necklace', 'accessory', 'blade',
  'weapon', 'pole', 'handle', 'armor',
]

const ACQUISITION_TERMS = [
  'obtained', 'obtain', 'acquired', 'received', 'earned', 'awarded', 'dropped', 'drop',
  'sold', 'purchased', 'bought', 'crafted', 'crafting', 'recipe', 'reward', 'quest',
  'defeat', 'defeating', 'kill', 'killing', 'found', 'source', 'shop', 'chest', 'boss', 'npc',
]

const LOCATION_TERMS = [
  'location', 'located', 'found', 'spawn', 'spawns', 'area', 'region', 'zone', 'dungeon',
  'island', 'town', 'city', 'village', 'cave', 'forest', 'mine', 'hive', 'castle', 'shrine',
  'deadlands', 'desert', 'swamp', 'mountain', 'ocean', 'near', 'next to', 'inside', 'within', 'outside',
]

const SOURCE_PATTERNS = [
  /(?:dropped|drop)\s+(?:by|from)\s+(.{2,180})/i,
  /(?:sold|purchased|bought)\s+(?:by|from|at)\s+(.{2,180})/i,
  /(?:obtained|acquired|received|earned|awarded)\s+(?:from|by|through|via|as|for)\s+(.{2,180})/i,
  /(?:reward(?:ed)?|quest reward)\s*(?:from|by|for|:)\s*(.{2,180})/i,
  /(?:given|granted)\s+(?:by|from)\s+(.{2,180})/i,
  /(?:defeat|defeating|kill|killing)\s+(.{2,160})/i,
]

const LOCATION_PATTERNS = [
  /(?:located|location|found|spawns?|available|appears)\s*(?:is|at|in|on|near|next to|inside|within|outside|:)\s+(.{2,220})/i,
  /\b(?:location|located at|found at|found in)\b\s*[:\-]?\s*(.{2,220})/i,
  /(?:found|spawn(?:s|ed)?|located|available|appears)\s+(?:in|at|inside|within|on|near|next to|outside)\s+(.{2,220})/i,
  /(?:in|at|near|next to|outside|inside|within)\s+(?:the\s+)?([A-Z][^.!?\n]{2,180})/i,
]

const BAD_TEXT = [
  /static\.wikiti\.net/i,
  /https?:\/\//i,
  /\/\/(?:static|upload)\./i,
  /^overview\s*[:\-]/i,
  /\b\d{2,4}\s*,\s*\d{2,4}\s*,\s*\d{1,4}\b/,
  /\b(?:300|600|900|1200)\s*x\s*\d+\b/i,
]

function normalize(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/\b\d+\s*x\b/g, ' ')
    .replace(/\bx\s*\d+\b/g, ' ')
    .replace(/\b(?:qty|quantity)\s*[:=]?\s*\d+\b/g, ' ')
    .replace(/\(.*?\)/g, ' ')
    .replace(/[’']/g, '')
    .replace(/&/g, ' and ')
    .replace(/\b(?:the|a|an)\b/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenize(value) {
  return normalize(value).split(' ').filter(Boolean)
}

function tokenSimilarity(a, b) {
  const aa = normalize(a)
  const bb = normalize(b)
  if (!aa || !bb) return 0
  if (aa === bb) return 1
  const aTokens = tokenize(a)
  const bTokens = tokenize(b)
  const bSet = new Set(bTokens)
  const intersection = aTokens.filter((token) => bSet.has(token)).length
  const union = new Set([...aTokens, ...bTokens]).size
  const jaccard = union ? intersection / union : 0
  const containment = aa.includes(bb) || bb.includes(aa) ? 0.92 : 0
  const matrix = Array.from({ length: aa.length + 1 }, (_, i) => i)
  for (let i = 1; i <= aa.length; i += 1) {
    let prev = matrix[0]
    matrix[0] = i
    for (let j = 1; j <= bb.length; j += 1) {
      const old = matrix[j]
      matrix[j] = aa[i - 1] === bb[j - 1] ? prev : Math.min(prev + 1, old + 1, matrix[j - 1] + 1)
      prev = old
    }
  }
  const editScore = 1 - matrix[bb.length] / Math.max(aa.length, bb.length)
  return Math.max(jaccard * 0.86, containment, editScore * 0.8)
}

function readCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') } catch { return {} }
}
function writeCache(key, value) {
  try {
    const cache = readCache()
    cache[key] = { timestamp: Date.now(), value }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch { /* cache is optional */ }
}
function getCached(key) {
  const entry = readCache()[key]
  if (!entry || Date.now() - entry.timestamp > CACHE_TTL) return null
  return entry.value
}

async function api(params, signal) {
  const query = new URLSearchParams({ ...params, format: 'json', origin: '*' })
  const response = await fetch(`${API_URL}?${query.toString()}`, { signal, headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`Wiki API returned ${response.status}`)
  const data = await response.json()
  if (data?.error) throw new Error(data.error.info || 'Wiki API error')
  return data
}

function wikiUrl(title) {
  return `${WIKI_BASE}/wiki/${encodeURIComponent(String(title).replace(/ /g, '_'))}`
}
function searchUrl(query) {
  return `${WIKI_BASE}/w/index.php?search=${encodeURIComponent(query)}`
}

function cleanText(value) {
  return String(value ?? '')
    .replace(/\r/g, '')
    .replace(/<span[^>]*>/gi, '')
    .replace(/<\/span>/gi, '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/\{\{[^{}]*\}\}/g, ' ')
    .replace(/'''?([^']+)'''?/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isGarbage(value) {
  const text = cleanText(value)
  return !text || text.length < 5 || BAD_TEXT.some((pattern) => pattern.test(text))
}

function dedupeStrings(values) {
  const seen = new Set()
  return values
    .map(cleanText)
    .filter((value) => !isGarbage(value))
    .filter((value) => {
      const key = normalize(value)
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
}

function compactSentence(value, max = 210) {
  let text = cleanText(value)
    .replace(/^(?:overview|description|obtain(?:ed)?|acquisition|location|source|drop)\s*[:\-|]\s*/i, '')
    .replace(/^\s*[-•*]\s*/, '')
    .trim()
  if (isGarbage(text)) return ''
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const last = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('; '), cut.lastIndexOf(', '))
  return `${(last > 80 ? cut.slice(0, last) : cut).trim()}…`
}

function sentenceList(value) {
  return cleanText(value)
    .split(/(?<=[.!?])\s+|(?<=;)\s+|\s+•\s+/)
    .map((s) => compactSentence(s, 300))
    .filter(Boolean)
}

function extractInfobox(doc) {
  const rows = []
  for (const table of doc.querySelectorAll('table.infobox, table[class*="infobox"], .portable-infobox')) {
    for (const row of table.querySelectorAll('tr, .pi-item')) {
      const cells = [...row.querySelectorAll('th, td, .pi-data-label, .pi-data-value')]
        .map((cell) => cleanText(cell.textContent))
        .filter(Boolean)
      if (cells.length >= 2) rows.push(`${cells[0]}: ${cells.slice(1).join(' ')}`)
    }
  }
  return dedupeStrings(rows)
}

function extractTables(doc) {
  const rows = []
  for (const table of doc.querySelectorAll('table')) {
    if (table.matches('.navbox, .metadata, .ambox, .mbox, .gallery')) continue
    for (const tr of table.querySelectorAll('tr')) {
      const cells = [...tr.querySelectorAll('th, td')].map((cell) => cleanText(cell.textContent)).filter(Boolean)
      if (cells.length >= 2) rows.push(cells.join(' | '))
    }
  }
  return dedupeStrings(rows)
}

function extractSectionsFromHtml(htmlText) {
  if (!htmlText) return { sections: [], infobox: [], tables: [], links: [] }
  const doc = new DOMParser().parseFromString(htmlText, 'text/html')
  const root = doc.querySelector('.mw-parser-output') || doc.body
  root.querySelectorAll('script, style, noscript, .navbox, .mw-editsection, .reference, .reflist, img, figure, .thumb, .gallery, .mw-file-element').forEach((node) => node.remove())

  const infobox = extractInfobox(doc)
  const tables = extractTables(doc)
  const links = [...root.querySelectorAll('a[href]')]
    .map((anchor) => ({
      title: anchor.getAttribute('title') || cleanText(anchor.textContent),
      href: anchor.getAttribute('href') || '',
      text: cleanText(anchor.textContent),
      context: cleanText(anchor.parentElement?.textContent || ''),
    }))
    .filter((link) => link.title && (link.href.startsWith('/wiki/') || link.href.startsWith('./')))
    .filter((link) => !link.href.includes(':'))
    .filter((link) => !/^edit$/i.test(link.title))

  const sections = []
  let current = { heading: 'Page', text: '' }
  sections.push(current)
  for (const node of root.querySelectorAll(':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6, :scope > p, :scope > ul, :scope > ol, :scope > dl, :scope > table')) {
    if (/^H[1-6]$/.test(node.tagName)) {
      current = { heading: cleanText(node.textContent), text: '' }
      sections.push(current)
    } else {
      const text = cleanText(node.textContent)
      if (text && !isGarbage(text)) current.text += `${text} `
    }
  }

  // Voxlblade pages use tabbers/cards/nested tables heavily. Preserve
  // leaf-level rows as a second extraction channel so stat/perk lines that
  // are not direct children of the article are still discoverable.
  const rawLines = [...root.querySelectorAll('h1,h2,h3,h4,h5,h6,li,td,th,p,span')]
    .map((node) => cleanText(node.textContent))
    .filter((line) => line && !isGarbage(line))

  return {
    sections: sections.map((section) => ({ heading: section.heading, text: cleanText(section.text) })).filter((s) => s.text),
    infobox,
    tables,
    links,
    rawLines: dedupeStrings(rawLines),
  }
}

async function fetchPlainExtract(title, signal) {
  try {
    const data = await api({ action: 'query', prop: 'extracts|info', titles: title, redirects: '1', explaintext: '1', exchars: '30000' }, signal)
    const pages = data?.query?.pages || {}
    const page = Object.values(pages)[0]
    if (!page || page.missing) return null
    return { title: page.title || title, plain: cleanText(page.extract || '') }
  } catch {
    return null
  }
}

async function fetchWikiText(title, signal) {
  try {
    const data = await api({ action: 'parse', page: title, prop: 'wikitext', redirects: '1' }, signal)
    const text = data?.parse?.wikitext?.['*']
    if (!data?.parse?.title || !text) return null
    return { title: data.parse.title, wikitext: text }
  } catch {
    return null
  }
}

function extractTemplateParams(wikitext) {
  const rows = []
  const source = String(wikitext || '')
  // MediaWiki templates are the authoritative source on many VoxlBlade pages.
  // Their rendered HTML can hide tabber/infobox values, so inspect named
  // template parameters as a second extraction channel.
  for (const match of source.matchAll(/\{\{([\s\S]*?)\}\}/g)) {
    const body = match[1]
    const parts = body.split(/\n?\s*\|/)
    for (let i = 1; i < parts.length; i += 1) {
      const eq = parts[i].indexOf('=')
      if (eq < 1) continue
      const key = cleanText(parts[i].slice(0, eq))
      const value = cleanText(parts[i].slice(eq + 1))
      if (key && value) rows.push(`${key}: ${value}`)
    }
  }
  return dedupeStrings(rows)
}

function extractStatsFromWikitext(wikitext, page = null) {
  const rows = extractTemplateParams(wikitext)
  const stats = {}
  const perks = []
  const multipliers = []
  const evidence = {}

  const keyAliases = new Map(STAT_ALIASES_NORMALIZED.map((label) => [
    normalize(label).replace(/\s+/g, ''),
    STAT_LABEL_ALIASES[label],
  ]))

  for (const row of rows) {
    const match = row.match(/^(.+?)\s*:\s*([+-]?\d+(?:\.\d+)?)\s*(%)?$/)
    if (!match) {
      const mult = row.match(/^(.+?)\s*:\s*x\s*([0-9]+(?:\.[0-9]+)?)$/i)
      if (mult) multipliers.push({ label: cleanText(mult[1]), value: Number(mult[2]), evidence: row })
      continue
    }
    const rawLabel = cleanText(match[1])
    const key = normalize(rawLabel).replace(/\s+/g, '')
    const statId = keyAliases.get(key) || STAT_LABEL_TO_ID.get(rawLabel.toLowerCase())
    const value = Number(match[2])
    if (statId && Number.isFinite(value)) {
      if (stats[statId] === undefined) {
        stats[statId] = normalizeWikiStatValue(statId, value, Boolean(match[3])) ?? value
        evidence[statId] = row
      }
      continue
    }
    // Unknown numeric fields are NOT automatically perks. Only retain a
    // field when the Wiki gives us a real perk signal (description/Perks
    // section) or it is a clearly named +1 ability. This prevents internal
    // template values such as Magic Scaling, Hex Type, Perk Amount,
    // Preceding Part SP, lv, exp, Bronze Ring and Slizard Chunk from leaking
    // into the player-facing Perks list.
    if (!match[3] && Number.isFinite(value) && value >= 0 && value <= 100 && rawLabel.length >= 2) {
      const description = findPerkDescription(page, rawLabel)
      if (isLikelyPerk(page, rawLabel, value, description)) {
        perks.push({ name: rawLabel, amount: value, description })
      }
    }
  }
  return { stats, perks, multipliers, evidence, rows }
}

async function fetchPage(title, signal) {
  const requestedTitle = String(title ?? '').trim()
  if (!requestedTitle) return null

  const cacheKey = `page:${requestedTitle}`
  const cached = getCached(cacheKey)
  if (cached) return cached

  let canonicalTitle = requestedTitle
  let htmlExtracted = { sections: [], infobox: [], tables: [], links: [], rawLines: [] }
  let plain = ''
  let wikitext = ''

  // Do not make HTML parsing a single point of failure. Miraheze/Wiki
  // protection can reject parse/text intermittently while the lightweight
  // query/revision endpoints remain available.
  try {
    const data = await api({ action: 'parse', page: requestedTitle, prop: 'text|sections', redirects: '1' }, signal)
    if (data?.parse?.title) {
      canonicalTitle = data.parse.title
      if (data.parse.text?.['*']) htmlExtracted = extractSectionsFromHtml(data.parse.text['*'])
    }
  } catch { /* use query/wikitext fallbacks */ }

  const extracted = await fetchPlainExtract(canonicalTitle, signal)
  if (extracted?.title) canonicalTitle = extracted.title
  plain = extracted?.plain || ''

  try {
    const wt = await fetchWikiText(canonicalTitle, signal)
    if (wt?.title) canonicalTitle = wt.title
    wikitext = wt?.wikitext || ''
  } catch { /* optional channel */ }

  if (!canonicalTitle || (!plain && !wikitext && !htmlExtracted.rawLines.length && !htmlExtracted.tables.length)) {
    return null
  }

  const templateRows = extractTemplateParams(wikitext)
  const result = {
    title: canonicalTitle,
    url: wikiUrl(canonicalTitle),
    plain,
    wikitext,
    templateRows,
    ...htmlExtracted,
  }
  writeCache(cacheKey, result)
  return result
}

async function searchWiki(query, signal, limit = 8) {
  const data = await api({ action: 'query', list: 'search', srsearch: query, srlimit: String(limit), srwhat: 'text', srprop: 'snippet|titlesnippet' }, signal)
  return data?.query?.search || []
}

function pageText(page) {
  return cleanText([
    page?.plain || '',
    ...(page?.rawLines || []),
    ...(page?.infobox || []),
    ...(page?.tables || []),
    ...(page?.sections || []).map((section) => section.text),
  ].join(' '))
}

function categoryWords(categoryHint) {
  return {
    weapon: ['weapon', 'blade', 'pole', 'handle', 'sword'],
    armor: ['armor', 'helmet', 'chest', 'chestplate', 'leggings', 'boots'],
    accessory: ['ring', 'rune', 'accessory'],
    enchant: ['enchant', 'enchantment'],
    infuse: ['infuse', 'infusion'],
    guild: ['guild'],
    shrine: ['shrine', 'shrine of balance'],
    race: ['race', 'races'],
  }[categoryHint] || []
}

function scoreSearchResult(input, result, categoryHint) {
  const titleScore = tokenSimilarity(input, result.title)
  const snippet = cleanText(result.snippet || '')
  const inputNorm = normalize(input)
  const titleNorm = normalize(result.title)
  let score = titleScore
  if (titleNorm === inputNorm) score += 0.28
  // Strong prefix: "galactic" → "galactic graviturgy"
  if (titleNorm.startsWith(inputNorm) && inputNorm.length >= 3) score += 0.22
  else if (titleNorm.startsWith(inputNorm) || inputNorm.startsWith(titleNorm)) score += 0.08
  if (titleNorm.includes(inputNorm) && inputNorm.length >= 4) score += 0.1
  const hints = categoryWords(categoryHint)
  if (hints.some((word) => `${result.title} ${snippet}`.toLowerCase().includes(word))) score += 0.06
  return Math.min(1, score)
}

function isEnchantmentName(name, categoryHint) {
  if (categoryHint === 'enchant') return true
  const normalized = normalize(name)
  return ENCHANTMENT_HINTS.some((hint) => normalized.includes(normalize(hint)))
}

async function findSpecialPage(names, cacheKey, searchTerm, signal) {
  const cached = getCached(cacheKey)
  if (cached) return cached
  for (const title of names) {
    try {
      const page = await fetchPage(title, signal)
      if (page?.title) {
        const result = { title: page.title, url: page.url }
        writeCache(cacheKey, result)
        return result
      }
    } catch { /* try next */ }
  }
  try {
    const results = await searchWiki(searchTerm, signal, 8)
    const best = results.sort((a, b) => tokenSimilarity(searchTerm, b.title) - tokenSimilarity(searchTerm, a.title))[0]
    if (best) {
      const page = await fetchPage(best.title, signal)
      const result = { title: page.title, url: page.url }
      writeCache(cacheKey, result)
      return result
    }
  } catch { /* fallback below */ }
  const result = { title: names[0], url: wikiUrl(names[0]) }
  writeCache(cacheKey, result)
  return result
}

async function findEnchantmentsPage(signal) {
  return findSpecialPage(ENCHANTMENT_PAGE_NAMES, 'special:enchantments-v2', 'Enchantments', signal)
}
async function findInfusionsPage(signal) {
  return findSpecialPage(INFUSION_PAGE_NAMES, 'special:infusions-v2', 'Infusions', signal)
}

function evidenceLines(page) {
  const rows = [
    ...page.infobox,
    ...page.tables,
    ...(page.plain ? sentenceList(page.plain) : []),
    ...page.sections.flatMap((section) => [section.text, ...sentenceList(section.text)]),
  ]
  return dedupeStrings(rows).filter((line) => !/^page\s*[:\-]/i.test(line))
}

function intentScore(text, terms, patterns = []) {
  const lower = text.toLowerCase()
  let score = 0
  for (const term of terms) if (lower.includes(term)) score += term.includes(' ') ? 3 : 2
  for (const pattern of patterns) if (pattern.test(text)) score += 5
  return score
}

function summarizeAcquisition(text, itemName = '') {
  let value = cleanText(text)
  if (isGarbage(value)) return ''
  value = value.replace(/^overview\s*[:\-]\s*/i, '')
  for (const pattern of SOURCE_PATTERNS) {
    const match = value.match(pattern)
    if (match) {
      let phrase = cleanText(match[0])
      phrase = phrase.replace(/\b(?:it|this item)\s+has\s+(?:a|an)\s+value.*$/i, '').trim()
      phrase = phrase.replace(/\s+(?:it|this item)\s+(?:is|has|can|also)\b.*$/i, '').trim()
      if (phrase) return compactSentence(phrase, 190)
    }
  }
  const sentences = sentenceList(value)
  const best = sentences
    .filter((sentence) => intentScore(sentence, ACQUISITION_TERMS, SOURCE_PATTERNS) >= 4)
    .sort((a, b) => intentScore(b, ACQUISITION_TERMS, SOURCE_PATTERNS) - intentScore(a, ACQUISITION_TERMS, SOURCE_PATTERNS))[0]
  return compactSentence(best || value, 190)
}

function inferAcquisition(page, itemName = '') {
  const lines = evidenceLines(page)
  const scored = lines
    .map((line) => ({ line, score: intentScore(line, ACQUISITION_TERMS, SOURCE_PATTERNS) }))
    .filter((entry) => entry.score >= 4)
    .sort((a, b) => b.score - a.score || a.line.length - b.line.length)
  const results = []
  for (const entry of scored) {
    const summary = summarizeAcquisition(entry.line, itemName)
    if (summary && !results.some((x) => normalize(x) === normalize(summary))) results.push(summary)
    if (results.length >= 2) break
  }
  return results
}

function summarizeLocation(text) {
  let value = cleanText(text)
  if (isGarbage(value)) return ''
  for (const pattern of LOCATION_PATTERNS) {
    const match = value.match(pattern)
    if (match) {
      const before = value.slice(0, match.index).trim()
      const after = cleanText(match[1])
      const phrase = `${before ? `${before} ` : ''}${after}`
      const compact = compactSentence(phrase, 220)
      if (compact && LOCATION_TERMS.some((term) => compact.toLowerCase().includes(term))) return compact
    }
  }
  if (LOCATION_TERMS.some((term) => value.toLowerCase().includes(term))) {
    const sentences = sentenceList(value)
    const best = sentences
      .filter((sentence) => intentScore(sentence, LOCATION_TERMS, LOCATION_PATTERNS) >= 4)
      .sort((a, b) => intentScore(b, LOCATION_TERMS, LOCATION_PATTERNS) - intentScore(a, LOCATION_TERMS, LOCATION_PATTERNS))[0]
    return compactSentence(best || value, 210)
  }
  return ''
}

function inferLocation(page) {
  const lines = evidenceLines(page)
  const scored = lines
    .map((line) => ({ line, score: intentScore(line, LOCATION_TERMS, LOCATION_PATTERNS) }))
    .filter((entry) => entry.score >= 4)
    .sort((a, b) => b.score - a.score || a.line.length - b.line.length)
  const results = []
  for (const entry of scored) {
    const summary = summarizeLocation(entry.line)
    if (summary && !results.some((x) => normalize(x) === normalize(summary))) results.push(summary)
    if (results.length >= 3) break
  }
  return results
}

function inferSource(page) {
  const lines = evidenceLines(page)
  const scored = lines
    .map((line) => ({ line, score: intentScore(line, ['dropped', 'sold', 'purchased', 'obtained', 'reward', 'defeat', 'boss', 'npc', 'source'], SOURCE_PATTERNS) }))
    .filter((entry) => entry.score >= 4)
    .sort((a, b) => b.score - a.score)
  return scored.length ? summarizeAcquisition(scored[0].line, page.title) : ''
}

function findSourceLinks(page) {
  return page.links
    .filter((link) => {
      const context = `${link.text} ${link.context}`
      return SOURCE_PATTERNS.some((pattern) => pattern.test(context)) || /\b(?:boss|npc|mob|enemy|shop|chest)\b/i.test(context)
    })
    .map((link) => ({ ...link, title: cleanText(link.title) }))
    .filter((link) => normalize(link.title) && normalize(link.title) !== normalize(page.title))
}

function findLocationLinks(page) {
  return page.links
    .filter((link) => LOCATION_TERMS.some((term) => `${link.text} ${link.context}`.toLowerCase().includes(term)))
    .map((link) => ({ ...link, title: cleanText(link.title), url: wikiUrl(link.title) }))
    .filter((link) => normalize(link.title) && normalize(link.title) !== normalize(page.title))
    .filter((link) => !/^(location|locations|area|areas|wiki|main page)$/i.test(link.title))
}

function linkLocations(locationTexts, pages) {
  const links = pages.flatMap(findLocationLinks)
  const unique = new Map()
  for (const link of links) {
    const key = normalize(link.title)
    if (!key || unique.has(key)) continue
    unique.set(key, link)
  }
  return locationTexts.map((text) => {
    const match = [...unique.values()].find((link) => normalize(text).includes(normalize(link.title)) || normalize(link.context).includes(normalize(text)))
    return { text, url: match?.url || null, title: match?.title || null }
  })
}

function findSlotKeywords(text) {
  const normalized = normalize(text)
  return SLOT_HINTS.filter((slot) => normalized.includes(normalize(slot)))
}
function isGenericSlotTitle(title) {
  return /^(helmet|head|chest|chestplate|leggings|boots|armor|ring|weapon|blade|pole|handle|accessory|infusion|infuse)$/i.test(cleanText(title))
}

function findInfusionTargetLinks(page) {
  const candidates = []
  for (const link of page.links) {
    const context = `${link.text} ${link.context}`
    const slots = findSlotKeywords(context)
    if (!slots.length || isGenericSlotTitle(link.title)) continue
    let score = slots.length * 3
    if (/helmet|chestplate|leggings|boots|ring/i.test(link.title)) score += 2
    if (/description|target|effect|infuse/i.test(context)) score += 1
    candidates.push({ title: cleanText(link.title), url: wikiUrl(link.title), slots, context: cleanText(link.context), score })
  }
  const seen = new Set()
  return candidates.sort((a, b) => b.score - a.score).filter((item) => {
    const key = normalize(item.title)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, 4)
}

async function intentSearch(query, signal) {
  const searches = [
    `${query} obtained`,
    `${query} dropped`,
    `${query} sold`,
    `${query} crafted`,
    `${query} reward`,
    `${query} location`,
    `${query} found`,
    `${query} near`,
    `${query} next to`,
    `${query} where`,
    `${query} source`,
  ]
  const results = await Promise.allSettled(searches.map((q) => searchWiki(q, signal, 5)))
  return results.flatMap((result) => result.status === 'fulfilled' ? result.value : [])
}

function extractSearchEvidence(results, query, intent) {
  const q = normalize(query)
  const terms = intent === 'acquisition' ? ACQUISITION_TERMS : LOCATION_TERMS
  return results
    .map((result) => {
      const snippet = cleanText(result.snippet || '')
      const titleScore = tokenSimilarity(query, result.title)
      const queryScore = normalize(snippet).includes(q) ? 4 : 0
      const termScore = terms.reduce((sum, term) => sum + (snippet.toLowerCase().includes(term) ? 2 : 0), 0)
      const score = titleScore * 3 + queryScore + termScore
      return { snippet, title: cleanText(result.title), score }
    })
    .filter((entry) => entry.snippet && !isGarbage(entry.snippet) && entry.score > 2)
    .sort((a, b) => b.score - a.score)
}

async function enrichFromSourcePages(page, acquisition, location, itemName, signal) {
  const links = findSourceLinks(page).slice(0, MAX_SOURCE_LOOKUPS)
  const sourceNames = []
  const locations = []
  const locationPages = [page]
  const acquisitions = [...acquisition]
  for (const link of links) {
    try {
      const sourcePage = await fetchPage(link.title, signal)
      const sourceLocation = inferLocation(sourcePage)
      const sourceAcquisition = inferAcquisition(sourcePage, itemName)
      locations.push(...sourceLocation)
      acquisitions.push(...sourceAcquisition)
      sourceNames.push(link.title)
      locationPages.push(sourcePage)
    } catch { /* source enrichment is optional */ }
  }
  return {
    acquisition: dedupeStrings(acquisitions).slice(0, 2),
    location: dedupeStrings([...location, ...locations]).slice(0, 3),
    locationLinks: linkLocations(dedupeStrings([...location, ...locations]), locationPages).slice(0, 3),
    sources: dedupeStrings(sourceNames).slice(0, 4),
  }
}

async function enrichInfusion(page, signal) {
  let targetLinks = findInfusionTargetLinks(page)
  const description = page.plain || pageText(page)
  if (!targetLinks.length) {
    const slots = [...new Set(findSlotKeywords(description))]
    const searched = []
    for (const slot of slots.slice(0, 4)) {
      try {
        const results = await searchWiki(`${page.title} ${slot}`, signal, 8)
        const best = results.sort((a, b) => tokenSimilarity(`${page.title} ${slot}`, b.title) - tokenSimilarity(`${page.title} ${slot}`, a.title))[0]
        if (best) searched.push({ title: best.title, url: wikiUrl(best.title), slots: [slot], context: cleanText(best.snippet || ''), score: 0.7 })
      } catch { /* continue */ }
    }
    targetLinks = searched
  }

  const targets = []
  const locations = []
  const pages = [page]
  for (const target of targetLinks.slice(0, MAX_LOCATION_LOOKUPS)) {
    try {
      const targetPage = await fetchPage(target.title, signal)
      let targetLocation = inferLocation(targetPage)
      let targetSource = inferSource(targetPage)
      pages.push(targetPage)
      if (!targetLocation.length) {
        const sourceLink = findSourceLinks(targetPage)[0]
        if (sourceLink) {
          try {
            const sourcePage = await fetchPage(sourceLink.title, signal)
            targetLocation = inferLocation(sourcePage)
            targetSource = targetSource || sourceLink.title
            pages.push(sourcePage)
          } catch { /* keep target */ }
        }
      }
      targets.push({ title: target.title, url: target.url, slots: target.slots, source: targetSource, locations: targetLocation })
      locations.push(...targetLocation)
    } catch { /* continue */ }
  }
  return {
    targets,
    locationLinks: linkLocations(dedupeStrings(locations), pages).slice(0, 4),
    locations: dedupeStrings(locations).slice(0, 4),
  }
}

async function searchAndFetchBest(query, categoryHint, signal) {
  const variants = [...new Set([
    query,
    `"${query}"`,
    `intitle:"${query}"`,
    normalize(query),
    query.replace(/\s*\/\s*/g, ' '),
    query.replace(/\s*\/\s*/g, ' or '),
  ].filter(Boolean))]
  for (const title of variants.slice(0, 3)) {
    try {
      const page = await fetchPage(title, signal)
      if (page?.title && tokenSimilarity(query, page.title) >= 0.9) {
        return { best: { title: page.title, score: 1, page, snippet: '' }, ranked: [] }
      }
    } catch { /* continue */ }
  }
  const allResults = []
  for (const variant of variants) {
    try { allResults.push(...await searchWiki(variant, signal, 12)) } catch { /* continue */ }
  }
  const unique = new Map()
  for (const result of allResults) {
    const old = unique.get(result.title)
    if (!old || (result.snippet || '').length > (old.snippet || '').length) unique.set(result.title, result)
  }
  const ranked = [...unique.values()].map((result) => ({ ...result, score: scoreSearchResult(query, result, categoryHint) })).sort((a, b) => b.score - a.score)
  const candidates = []
  for (const result of ranked.slice(0, 6)) {
    try {
      const page = await fetchPage(result.title, signal)
      const titleScore = tokenSimilarity(query, page.title)
      const text = pageText(page)
      const exactInContent = normalize(text).includes(normalize(query)) ? 0.08 : 0
      const categoryScore = categoryWords(categoryHint).some((word) => text.toLowerCase().includes(word)) ? 0.04 : 0
      candidates.push({ ...result, page, score: Math.min(1, result.score * 0.72 + titleScore * 0.18 + exactInContent + categoryScore) })
    } catch {
      candidates.push({ ...result, page: null })
    }
  }
  candidates.sort((a, b) => b.score - a.score)
  return { best: candidates[0], ranked: candidates }
}

export async function findWikiItem(name, signal, options = {}) {
  const originalName = String(name ?? '').trim()
  if (!originalName) return null
  const categoryHint = options.category || ''
  const normalizedName = normalize(originalName)
  const cacheKey = `match:${categoryHint}:${normalizedName}`
  const cached = getCached(cacheKey)
  if (cached) return cached

  if (isEnchantmentName(originalName, categoryHint)) {
    const page = await findEnchantmentsPage(signal)
    const result = {
      query: originalName, matched: true, specialType: 'enchantment', title: page.title, score: 1,
      url: page.url, suggestions: [], directSearchUrl: searchUrl(originalName), specialPageUrl: page.url,
    }
    writeCache(cacheKey, result)
    return result
  }

  // Infusions are documented as a system/category rather than as ordinary
  // item pages. Do not waste time matching the infusion name to an unrelated
  // equipment page; the user explicitly wants the Infusions wiki page.
  if (categoryHint === 'infuse') {
    const page = await findInfusionsPage(signal)
    const result = {
      query: originalName, matched: true, specialType: 'infuse', title: page.title, score: 1,
      url: page.url, suggestions: [], directSearchUrl: searchUrl(originalName), specialPageUrl: page.url,
    }
    writeCache(cacheKey, result)
    return result
  }

  let search
  try { search = await searchAndFetchBest(originalName, categoryHint, signal) } catch { search = { best: null, ranked: [] } }
  const best = search.best
  if (!best || best.score < 0.55 || !best.page) {
    const fallback = {
      query: originalName, matched: false, title: null, score: best?.score ?? 0,
      suggestions: (search.ranked || []).slice(0, 5).map((item) => ({ title: item.title, score: item.score, url: wikiUrl(item.title) })),
      directSearchUrl: searchUrl(originalName),
    }
    writeCache(cacheKey, fallback)
    return fallback
  }

  const page = best.page
  // The item modal intentionally stays lightweight: it only needs a reliable
  // wiki match and a navigation target. Acquisition/location extraction was
  // removed from the UI, so do not run extra intent searches or source-page
  // crawling here. This makes opening an item faster and avoids stale/noisy
  // snippets being mistaken for facts.
  const result = {
    query: originalName,
    matched: true,
    specialType: null,
    title: page.title,
    score: best.score,
    url: page.url,
    suggestions: search.ranked.slice(1, 4).map((item) => ({
      title: item.title,
      score: item.score,
      url: wikiUrl(item.title),
    })),
    directSearchUrl: searchUrl(originalName),
  }
  writeCache(cacheKey, result)
  return result

}


// ---------------------------------------------------------------------------
// STAT/PERK RESOLUTION (remastered)
// ---------------------------------------------------------------------------
// Voxlblade wiki item pages almost always present stats in this exact shape
// (see equipment Tabber blocks):
//
//   Earth Boost: +20%
//   Magic Boost: +20%
//   Speed Boost: -5%
//   Attack Speed: -15%
//   Warding: +20%
//   Essence Ray: +1
//   <description paragraph...>
//
// Ascended variants appear in a second block with higher numbers. We always
// prefer the *first* (base) occurrence of each stat so Upgrade: +0 values are
// used by default.
//
// Distinction:
//   "Physical Boost: +10%"  -> STAT (percentage)
//   "Protection: +5" / "-10" -> STAT (flat)
//   "Heavy Gravitate: +1"   -> PERK (never folded into a percentage stat)
// ---------------------------------------------------------------------------

const STAT_LABEL_ALIASES = {
  'Air Boost': 'airBoost',
  'Dexterity Boost': 'dexterityBoost',
  'Earth Boost': 'earthBoost',
  'Fire Boost': 'fireBoost',
  'Hex Boost': 'hexBoost',
  'Holy Boost': 'holyBoost',
  'Magic Boost': 'magicBoost',
  'Physical Boost': 'physicalBoost',
  'Water Boost': 'waterBoost',
  'Speed Boost': 'speedBoost',
  'Summon Boost': 'summonBoost',
  'Attack Speed': 'attackSpeed',
  'Atk Speed': 'attackSpeed',
  'Jump Boost': 'jumpBoost',
  'Air Defense': 'airDefense',
  'Earth Defense': 'earthDefense',
  'Fire Defense': 'fireDefense',
  'Hex Defense': 'hexDefense',
  'Holy Defense': 'holyDefense',
  'Magic Defense': 'magicDefense',
  'Physical Defense': 'physicalDefense',
  'Water Defense': 'waterDefense',
  'Protection': 'protection',
  'Warding': 'warding',
  'Tenacity': 'tenacity',
  'Cold Resistance': 'coldResistance',
  'Heat Resistance': 'heatResistance',
  'Lifesteal': 'lifesteal',
  'Armor Penetration': 'armorPenetration',
  'Armour Penetration': 'armorPenetration',
  'Cooldown': 'cooldown',
  'Cooldown Reduction': 'cooldownReduction',
}

const STAT_TYPES = {
  airBoost: 'percentage', dexterityBoost: 'percentage', earthBoost: 'percentage',
  fireBoost: 'percentage', hexBoost: 'percentage', holyBoost: 'percentage',
  magicBoost: 'percentage', physicalBoost: 'percentage', waterBoost: 'percentage',
  speedBoost: 'percentage', summonBoost: 'percentage',
  attackSpeed: 'percentage', jumpBoost: 'flat',
  airDefense: 'percentage', earthDefense: 'percentage', fireDefense: 'percentage',
  hexDefense: 'percentage', holyDefense: 'percentage', magicDefense: 'percentage',
  physicalDefense: 'percentage', waterDefense: 'percentage',
  protection: 'flat', warding: 'percentage', tenacity: 'flat',
  coldResistance: 'percentage', heatResistance: 'percentage', lifesteal: 'flat',
  armorPenetration: 'flat',
  cooldown: 'flat',
  cooldownReduction: 'percentage',
}

const STAT_ALIASES_NORMALIZED = Object.keys(STAT_LABEL_ALIASES)
  .sort((a, b) => b.length - a.length)

const STAT_LABEL_TO_ID = new Map(
  STAT_ALIASES_NORMALIZED.map((label) => [label.toLowerCase(), STAT_LABEL_ALIASES[label]]),
)

const META_WORDS = new Set([
  'tier', 'type', 'atk speed', 'attack speed', 'damage types', 'damage scalings',
  'stat boosts', 'perks', 'obtain', 'obtained', 'acquired', 'location',
  'requirement', 'rarity', 'cost', 'level', 'cooldown', 'duration', 'effects',
  'enchantments', 'switch to ascended', 'upgrade', 'obtainment', 'gallery', 'trivia',
  'value', 'page', 'overview', 'stats', 'bonuses', 'description', 'history',
  'categories', 'community content', 'helmet', 'chestplate', 'leggings', 'ring',
])

// Numeric fields on Voxlblade Wiki pages are NOT automatically perks. A large
// number of equipment templates expose implementation/progression fields such
// as `Magic Scaling`, `Hex Type`, `Perk 1 Amount`, `Preceding Part SP`, `lv`,
// `exp`, and material counters. Those are useful source data, but they are not
// player-facing perks and must never appear in the Perks panel.
const NON_PERK_NUMERIC_LABELS = [
  /^perk(?:\s*\d+)?\s*amount$/i,
  /^preceding\s+part(?:\s*\d+)?(?:\s+sp)?$/i,
  /^preceding\s+part\s+sp$/i,
  /\b(?:scaling|type)\b/i,
  /\b(?:amount|quantity|qty|count)\b/i,
  /\b(?:sp|skill\s*points?)\b/i,
  /^(?:lv|lvl|level|exp|experience)$/i,
  /^(?:value|cost|price|rarity|tier|cooldown|duration|chance)$/i,
]

function isNonPerkNumericLabel(label) {
  const text = cleanText(label).replace(/\s+/g, ' ')
  if (!text) return true
  const lower = text.toLowerCase()
  if (META_WORDS.has(lower)) return true
  return NON_PERK_NUMERIC_LABELS.some((pattern) => pattern.test(text))
}

function hasExplicitPerkContext(page, label) {
  const target = normalize(label)
  if (!target) return false
  return (page?.sections || []).some((section) => {
    const heading = normalize(section.heading || '')
    if (!/(?:^|\s)(?:perk|perks|passive|passives|abilities|ability)(?:\s|$)/i.test(heading)) return false
    return normalize(section.text || '').includes(target)
  })
}

function isLikelyPerk(page, label, amount, description = '') {
  const cleanLabel = cleanText(label).replace(/\s+/g, ' ')
  if (!cleanLabel || isNonPerkNumericLabel(cleanLabel)) return false

  // Real player-facing perks normally have an explanatory description. This
  // is the strongest signal for newly added Wiki perks that are not yet in our
  // local database.
  if (String(description || '').trim().length >= 12) return true

  // Some aggregate Wiki tables put perks directly under a Perks/Passive
  // heading without an adjacent description. Accept those explicitly, but do
  // not accept arbitrary numeric template fields.
  if (hasExplicitPerkContext(page, cleanLabel)) return true

  // A bare +1 named field is only accepted when it looks like a real ability
  // name. This deliberately rejects metadata/material fields even when they
  // happen to equal +1 (e.g. Bronze Ring, Perk Amount).
  return Number(amount) === 1 && /^[A-Z][A-Za-z0-9'’&()\- /]{2,60}$/.test(cleanLabel) &&
    !/^(?:bronze ring|slizard chunk|magic scaling|hex scaling|dexterity scaling|hex type|magic type)$/i.test(cleanLabel)
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalizeWikiStatValue(statId, raw, hadPercent) {
  let value = Number(raw)
  if (!Number.isFinite(value)) return null

  // Warding sometimes appears as +0.2 (decimal) on older pages; normalize to %.
  if (statId === 'warding' && Math.abs(value) <= 1 && !hadPercent) value *= 100
  return value
}

function wikiPageCorpus(page) {
  // Prefer structured sources first so tabber / table layout is preserved.
  const chunks = [
    ...(page?.rawLines || []),
    ...(page?.tables || []),
    ...(page?.infobox || []),
    ...(page?.sections || []).map((s) => `${s.heading}\n${s.text}`),
    page?.plain || '',
    ...(page?.templateRows || []),
    page?.wikitext || '',
  ]
  return chunks
    .map((c) => String(c ?? '')
      .replace(/\r/g, '')
      .replace(/'''?/g, '')
      .replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, '$2')
      .replace(/\[\[([^\]]+)\]\]/g, '$1')
      .replace(/\{\{[^{}]*\}\}/g, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/?[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n'))
    .join('\n')
}

/**
 * Line-oriented parser that mirrors the in-game / wiki Stats panel.
 * Returns only the *first* (base / non-ascended) value for each stat or perk.
 */
function extractWikiStatsAndPerks(page) {
  const corpus = wikiPageCorpus(page)
  const rawLines = [
    ...(page?.rawLines || []),
    ...(page?.tables || []),
    ...(page?.infobox || []),
    ...(page?.sections || []).flatMap((s) => [s.heading, s.text]),
    ...(page?.plain ? sentenceList(page.plain, 500) : []),
  ]
    .map((line) => cleanText(line).replace(/^[•·*\-–—]\s*/, '').trim())
    .filter(Boolean)

  const lines = dedupeStrings(rawLines)
  const stats = {}
  const evidence = {}
  const perkMap = new Map()
  const multipliers = []

  const statRe = /^([A-Za-z][A-Za-z0-9'’&()\- /]{1,80}?)\s*(?::|\||\s)\s*([+-]?\d+(?:\.\d+)?)\s*(%)?\s*$/
  const multiplierRe = /^([A-Za-z][A-Za-z0-9'’&()\- /]{1,80}?)\s*(?::|\||\s)\s*x\s*([0-9]+(?:\.[0-9]+)?)\s*$/i
  const inlineMultiplierRe = /\b([A-Za-z][A-Za-z0-9'’&()\- /]{1,60}?)\s*(?:multiplier|boosts?)\s*[:|]?\s*x\s*([0-9]+(?:\.[0-9]+)?)/ig

  const recordStat = (rawLabel, rawNum, hadPercent, sourceLine) => {
    const label = cleanText(rawLabel).replace(/\s+/g, ' ')
    const lower = label.toLowerCase()
    if (!label || META_WORDS.has(lower)) return false

    const statId = STAT_LABEL_TO_ID.get(lower)
    if (!statId) return false
    if (stats[statId] !== undefined) return true

    const value = normalizeWikiStatValue(statId, rawNum, hadPercent)
    if (value == null) return true
    stats[statId] = value
    evidence[statId] = sourceLine || `${label}: ${rawNum}${hadPercent ? '%' : ''}`
    return true
  }

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]

    const multiplier = line.match(multiplierRe)
    if (multiplier) {
      const label = cleanText(multiplier[1])
      const value = Number(multiplier[2])
      if (label && Number.isFinite(value) && value > 0 && value <= 10) {
        multipliers.push({ label, value, evidence: line })
      }
      continue
    }

    const match = line.match(statRe)
    if (!match) {
      // Some Wiki cards put several stat fragments in one paragraph.
      for (const fragment of line.match(/[A-Za-z][A-Za-z0-9'’&()\- /]{1,80}\s*[:|]\s*[+-]?\d+(?:\.\d+)?\s*%?/g) || []) {
        const m = fragment.match(/^(.+?)\s*[:|]\s*([+-]?\d+(?:\.\d+)?)\s*(%)?$/)
        if (m) recordStat(m[1], Number(m[2]), Boolean(m[3]), fragment)
      }
      for (const m of line.matchAll(inlineMultiplierRe)) {
        const value = Number(m[2])
        if (Number.isFinite(value) && value > 0 && value <= 10) {
          multipliers.push({ label: cleanText(m[1]), value, evidence: m[0] })
        }
      }
      continue
    }

    const rawLabel = cleanText(match[1]).replace(/\s+/g, ' ')
    const rawNum = Number(match[2])
    const hadPercent = Boolean(match[3])

    if (recordStat(rawLabel, rawNum, hadPercent, line)) continue

    // In the in-game/Wiki presentation, named "+1" style effects are perks,
    // while percentages belong to the stat system. Keep them separate.
    const lower = rawLabel.toLowerCase()
    if (META_WORDS.has(lower)) continue
    if (rawLabel.length < 2 || rawLabel.length > 80) continue
    if (!Number.isFinite(rawNum) || rawNum < 0 || rawNum > 100) continue
    if (hadPercent) continue
    if (isNonPerkNumericLabel(rawLabel)) continue
    if (perkMap.has(lower)) continue

    let description = ''
    for (let j = i + 1; j < Math.min(i + 5, lines.length); j += 1) {
      const next = lines[j]
      if (statRe.test(next) || multiplierRe.test(next)) break
      if (/^(enchantments|switch to ascended|upgrade|gallery|trivia|obtainment|source|location)/i.test(next)) break
      if (next.length > 25 && !/^https?:/i.test(next)) {
        description = next
        break
      }
    }
    if (!description) description = findPerkDescription(page, rawLabel)
    if (!isLikelyPerk(page, rawLabel, rawNum, description)) continue

    perkMap.set(lower, { name: rawLabel, amount: rawNum, description })
  }

  // Template-parameter fallback. Many VoxlBlade item/armor pages expose
  // their real stats through ArmorStats/WeaponStats-style templates. The
  // rendered page can hide these values, so parse the template parameters too.
  const templateParsed = extractStatsFromWikitext(page?.wikitext || '', page)
  for (const [statId, value] of Object.entries(templateParsed.stats)) {
    if (stats[statId] === undefined) {
      stats[statId] = value
      evidence[statId] = templateParsed.evidence[statId]
    }
  }
  for (const perk of templateParsed.perks) {
    const key = normalize(perk.name)
    if (!perkMap.has(key)) perkMap.set(key, perk)
  }
  multipliers.push(...templateParsed.multipliers)

  // Complete-corpus fallback for known stat labels. This catches values that
  // were concatenated by MediaWiki's HTML/tabber output.
  for (const label of STAT_ALIASES_NORMALIZED) {
    const statId = STAT_LABEL_ALIASES[label]
    if (stats[statId] !== undefined) continue
    const escaped = escapeRegex(label)
    const re = new RegExp(`${escaped}\\s*(?::|\\||\\s)\\s*([+-]?\\d+(?:\\.\\d+)?)\\s*(%)?`, 'i')
    const m = corpus.match(re)
    if (!m) continue
    const value = normalizeWikiStatValue(statId, Number(m[1]), Boolean(m[2]))
    if (value == null) continue
    stats[statId] = value
    evidence[statId] = m[0]
  }

  const seenMultiplier = new Set()
  const uniqueMultipliers = multipliers.filter((entry) => {
    const key = `${normalize(entry.label)}|${entry.value}`
    if (seenMultiplier.has(key)) return false
    seenMultiplier.add(key)
    return true
  })

  return {
    stats,
    perks: [...perkMap.values()],
    evidence,
    multipliers: uniqueMultipliers,
  }
}
function findPerkDescription(page, perkName) {
  const target = normalize(perkName)
  const candidates = [
    ...(page?.sections || []).map((s) => s.text),
    page?.plain || '',
    ...(page?.tables || []),
  ]
  for (const text of candidates) {
    const sentences = sentenceList(text)
    const hit = sentences.find((sentence) => {
      const n = normalize(sentence)
      return n.includes(target) && n.length > target.length + 12
    })
    if (hit) return cleanText(hit)
  }
  return ''
}

function wikiCategoryForSlot(slotLabel) {
  const s = String(slotLabel ?? '').toLowerCase()
  if (s.includes('guild')) return 'guild'
  if (s.includes('race')) return 'race'
  if (s.includes('enchant')) return 'enchantment'
  if (s.includes('shrine') || s.includes('sob')) return 'shrine'
  // Infusions are equipment pieces — resolve them as armor/ring, not the Infusion system page
  if (s.includes('infus')) {
    if (s.includes('ring')) return 'accessory'
    if (s.includes('helmet') || s.includes('head') || s.includes('chest') || s.includes('legging') || s.includes('leg')) return 'armor'
    return 'armor'
  }
  if (s.includes('rune')) return 'accessory'
  if (s.includes('ring') || s.includes('accessory')) return 'accessory'
  if (s.includes('helmet') || s.includes('head') || s.includes('chest') || s.includes('legging') || s.includes('armor')) return 'armor'
  if (s.includes('blade') || s.includes('handle') || s.includes('pole') || s.includes('weapon') || s.includes('essence') || s.includes('gloves')) return 'weapon'
  return ''
}

/** True when this loadout slot represents an infused piece (half stats + full perk). */
export function isInfusionSlot(slotLabel) {
  return /infus/i.test(String(slotLabel ?? ''))
}

/**
 * Build a prioritized list of wiki page titles to try for an exact-name lookup.
 * Covers the common Voxlblade naming patterns:
 *   Relic Jewel
 *   Galactic Graviturgy
 *   Hex Web Rune / Hex Web
 *   Queen Bumblz (Armor)
 *   Hallowed Blade
 */


/** Piece suffixes that appear on set pages but are NOT separate wiki titles. */
const ARMOR_PIECE_SUFFIXES = [
  'helmet', 'helm', 'hood', 'hat', 'mask', 'crown', 'circlet', 'head',
  'chestplate', 'chest', 'cloak', 'robe', 'vest', 'shirt', 'torso', 'body',
  'leggings', 'legs', 'pants', 'greaves', 'boots', 'shoes', 'foot',
  'gauntlets', 'gloves', 'bracers',
]

const WEAPON_PART_SUFFIXES = [
  'blade', 'handle', 'pole', 'essence', 'core', 'gloves', 'fist',
]

/**
 * Smart query normalizer — thinks like the wiki.
 * "Pyre Druid Chestplate" → base "Pyre Druid" (set page)
 * "Galactic" stays "Galactic" for prefix search
 * "Hex Web" → also consider "Hex Web Rune"
 */
function smartNormalizeQuery(query, slotLabel, category) {
  const raw = String(query ?? '').trim()
  const slot = String(slotLabel ?? '').toLowerCase()
  let base = raw
  let pieceHint = null

  // Strip armor piece suffixes from the query itself
  const armorRe = new RegExp(
    `\\s+(${ARMOR_PIECE_SUFFIXES.join('|')})s?$`,
    'i',
  )
  const armorMatch = base.match(armorRe)
  if (armorMatch) {
    pieceHint = armorMatch[1].toLowerCase()
    base = base.replace(armorRe, '').trim()
  }

  // Strip weapon part suffixes only when slot suggests a full weapon name was typed
  const weaponRe = new RegExp(
    `\\s+(${WEAPON_PART_SUFFIXES.join('|')})s?$`,
    'i',
  )
  // For armor/infusion categories, always prefer set name
  const isArmorLike = category === 'armor' || /armor|helmet|chest|legging|infus|head|leg/i.test(slot)

  return {
    original: raw,
    base: base || raw,
    pieceHint,
    isArmorLike,
    isPartial: base.split(/\\s+/).length <= 1 && base.length >= 3 && base.length <= 12,
  }
}

/**
 * Title candidates — NEVER invent "SetName Chestplate" pages.
 * Wiki armor pages are set-level only (Pyre Druid, Galactic Graviturgy, …).
 */
function buildTitleCandidates(query, slotLabel, category) {
  const info = smartNormalizeQuery(query, slotLabel, category)
  const q = info.base
  const slot = String(slotLabel ?? '').trim()
  const titles = new Set()
  const add = (t) => { if (t && String(t).trim().length > 1) titles.add(String(t).trim()) }

  // Primary: cleaned set/item name
  add(q)
  add(info.original)

  // Armor / infusion → SET PAGE ONLY (Revved, Pyre Druid, Galactic Graviturgy…)
  // Never invent "Revved Helmet" / "Pyre Druid Chestplate" — wiki has one page per set.
  if (info.isArmorLike || category === 'armor') {
    add(q) // set name only
    add(`${q} (Armor)`)
  }

  // Rings
  if (category === 'accessory' || /ring/i.test(slot) || /ring$/i.test(q)) {
    if (!/ring$/i.test(q)) add(`${q} Ring`)
  }

  // Runes
  if (category === 'accessory' || /rune/i.test(slot) || /rune/i.test(q)) {
    if (!/rune$/i.test(q)) add(`${q} Rune`)
  }

  // Weapons — part pages DO exist (Hallowed Blade, Queen Bumblz Pole)
  if (category === 'weapon' || /blade|handle|pole|weapon|essence|gloves|core/i.test(slot)) {
    if (info.original !== q) add(info.original) // keep "Hallowed Blade" if user typed it
    add(`${q} Blade`)
    add(`${q} Handle`)
    add(`${q} Pole`)
    add(`${q} Essence`)
    add(`${q} Core`)
  }

  // Guilds
  if (category === 'guild' || /guild/i.test(slot)) {
    add(`${q} (Guild)`)
    add(`${q} Guild`)
  }

  // Races
  if (category === 'race' || /race/i.test(slot)) {
    add(`${q} (Race)`)
  }

  return [...titles]
}

/**
 * Prefix / fuzzy title match via wiki search.
 * "Galactic" → ranks pages whose title starts with or contains Galactic.
 */
async function fuzzySearchTitles(partial, category, signal) {
  const q = String(partial ?? '').trim()
  if (q.length < 2) return []

  const queries = [
    q,
    category === 'armor' ? `${q} armor` : null,
    category === 'accessory' ? `${q} rune` : null,
    category === 'accessory' ? `${q} ring` : null,
    category === 'guild' ? `${q} guild` : null,
  ].filter(Boolean)

  const seen = new Map()
  for (const query of queries) {
    if (signal?.aborted) break
    try {
      const results = await searchWiki(query, signal, 12)
      for (const r of results) {
        const title = r.title
        const titleNorm = normalize(title)
        const qNorm = normalize(q)
        let score = tokenSimilarity(q, title)

        // Strong boost: title starts with query ("Galactic Graviturgy")
        if (titleNorm.startsWith(qNorm)) score += 0.35
        // Boost: all query tokens appear in title
        const qTokens = tokenize(q)
        if (qTokens.length && qTokens.every((t) => titleNorm.includes(t))) score += 0.2
        // Armor: prefer shorter set-style titles (no "Chestplate" in title)
        if (category === 'armor' || category === '') {
          if (ARMOR_PIECE_SUFFIXES.some((s) => titleNorm.endsWith(s))) score -= 0.25
          if (/\(armor\)$/i.test(title) || !/\b(helmet|chestplate|leggings|hood|cloak|pants)\b/i.test(title)) {
            score += 0.08
          }
        }

        score = Math.min(1, score)
        const prev = seen.get(title)
        if (!prev || score > prev.score) {
          seen.set(title, { title, score, snippet: r.snippet || '' })
        }
      }
    } catch { /* continue */ }
  }

  return [...seen.values()].sort((a, b) => b.score - a.score)
}


/**
 * Races live on a single aggregate page with tabber sections.
 * Extract the matching race block and turn passives into stats/perks.
 */
async function resolveRaceFromAggregate(raceName, signal) {
  const page = await fetchPage('Races', signal)
  if (!page) return null

  const corpus = wikiPageCorpus(page)
  const target = normalize(raceName)
  if (!target) return null

  // Split on RACE DESCRIPTION / tab-like boundaries
  const blocks = corpus.split(/(?=RACE DESCRIPTION|RACE PASSIVE|## )/i)
  let bestBlock = ''
  let bestScore = 0

  for (const block of blocks) {
    const score = tokenSimilarity(raceName, block.slice(0, 200))
    // Also check if the race name appears near the start of the block
    const head = normalize(block.slice(0, 400))
    const contains = head.includes(target) ? 0.5 : 0
    const s = Math.max(score, contains)
    if (s > bestScore) {
      bestScore = s
      bestBlock = block
    }
  }

  // Fallback: find paragraph containing the race name
  if (bestScore < 0.3) {
    const sentences = sentenceList(corpus)
    const hit = sentences.find((s) => normalize(s).includes(target) && s.length > 40)
    if (hit) bestBlock = hit
    else return null
  }

  // Parse numeric stats from the race block
  const fakePage = {
    plain: bestBlock,
    tables: [],
    infobox: [],
    sections: [{ heading: raceName, text: bestBlock }],
  }
  const parsed = extractWikiStatsAndPerks(fakePage)

  // Race passives are often free-text — capture as a perk
  const passiveMatch = bestBlock.match(/RACE PASSIVE\s*([\s\S]{10,400}?)(?=## |RACE DESCRIPTION|Passive Details|$)/i)
  const detailsMatch = bestBlock.match(/Passive Details\s*([\s\S]{10,500}?)(?=## |Additional Notes|RACE DESCRIPTION|$)/i)
  const passiveText = cleanText(detailsMatch?.[1] || passiveMatch?.[1] || '')

  if (passiveText && parsed.perks.length === 0) {
    parsed.perks.push({
      name: `${raceName} Passive`,
      amount: 1,
      description: passiveText.slice(0, 400),
    })
  } else if (passiveText && parsed.perks.length > 0 && !parsed.perks[0].description) {
    parsed.perks[0].description = passiveText.slice(0, 400)
  }

  // Common race numeric patterns not always in "Stat: +N%" form
  const extraPatterns = [
    [/(\d+)\s*%\s*(?:damage reduction|damage boost)/gi, null],
    [/(\d+)\s*armor penetration/gi, 'armorPenetration'],
    [/(\d+)\s*%\s*(?:rune|weapon art)\s*cooldown reduction/gi, 'cooldownReduction'],
    [/(\d+)\s*%\s*warding/gi, 'warding'],
    [/\+?(\d+)\s*protection/gi, 'protection'],
    [/\+?(\d+)\s*jump boost/gi, 'jumpBoost'],
    [/(\d+)\s*%\s*(?:movement )?speed/gi, 'speedBoost'],
  ]

  for (const [re, statId] of extraPatterns) {
    if (!statId) continue
    if (parsed.stats[statId] !== undefined) continue
    const m = bestBlock.match(re)
    if (m) {
      const value = normalizeWikiStatValue(statId, Number(m[1]), /%/.test(m[0]))
      if (value != null) {
        parsed.stats[statId] = value
        parsed.evidence[statId] = m[0]
      }
    }
  }

  const hasData = Object.keys(parsed.stats).length > 0 || parsed.perks.length > 0
  if (!hasData) return null

  return {
    name: raceName,
    wikiUrl: `${WIKI_BASE}/wiki/Races`,
    slotType: 'race',
    stats: parsed.stats,
    perks: parsed.perks,
    evidence: parsed.evidence,
    multipliers: parsed.multipliers || [],
    verified: true,
    source: 'Voxlblade Wiki (Races)',
    matchScore: Math.max(0.85, bestScore),
  }
}


/**
 * Extract one named entry from an aggregate Wiki page (Races, Guilds,
 * Enchantments, etc.). Voxlblade has many systems where the individual
 * game object is a tab/card inside one page instead of its own article.
 *
 * The resolver intentionally uses exact-name evidence first. Fuzzy matching
 * is only used after the exact title/page and exact aggregate block attempts.
 */
async function resolveNamedAggregateEntry(aggregateTitles, name, slotType, signal) {
  const target = normalize(name)
  if (!target) return null

  for (const aggregateTitle of aggregateTitles) {
    try {
      const page = await fetchPage(aggregateTitle, signal)
      if (!page) continue

      const lines = dedupeStrings([
        ...(page.rawLines || []),
        ...(page.sections || []).flatMap((section) => [section.heading, section.text]),
        ...(page.tables || []),
      ].map((line) => cleanText(line).replace(/^[•·*\-–—]\s*/, '').trim()))
      const normalizedTarget = normalize(name)

      // Exact line first, then a strong "line contains exact target" match.
      let index = lines.findIndex((line) => normalize(line) === normalizedTarget)
      if (index < 0) {
        index = lines.findIndex((line) => {
          const n = normalize(line)
          return n.includes(normalizedTarget) && n.length <= normalizedTarget.length + 40
        })
      }

      if (index < 0) {
        // Some MediaWiki tabbers do not expose the tab title as a clean text
        // node. Fall back to a title search, but only accept a strong match.
        const searchResults = await searchWiki(`"${name}" ${slotType}`, signal, 8).catch(() => [])
        const exact = searchResults
          .map((result) => ({ ...result, score: tokenSimilarity(name, result.title) }))
          .sort((a, b) => b.score - a.score)[0]
        if (exact && exact.score >= 0.9) {
          const exactPage = await fetchPage(exact.title, signal)
          if (exactPage) {
            const parsedExact = extractWikiStatsAndPerks(exactPage)
            if (Object.keys(parsedExact.stats).length || parsedExact.perks.length || parsedExact.multipliers.length) {
              return {
                name: exactPage.title,
                wikiUrl: exactPage.url,
                slotType,
                stats: parsedExact.stats,
                perks: parsedExact.perks,
                multipliers: parsedExact.multipliers,
                evidence: parsedExact.evidence,
                verified: true,
                source: `Voxlblade Wiki (${exactPage.title})`,
                matchScore: exact.score,
                resolvedAs: exactPage.title,
              }
            }
          }
        }
        continue
      }

      // Stop at the next likely named card/section. We deliberately keep the
      // window bounded so one enchant/race/guild cannot consume its neighbour.
      const stopRe = /^(?:race description|race passive|guild description|guild passive|description|stats?|effects?|perks?|enchantments?)$/i
      const block = []
      for (let i = index; i < Math.min(lines.length, index + 45); i += 1) {
        const line = lines[i]
        if (i > index && normalize(line) !== normalizedTarget) {
          // A new title-like short line is a boundary when it is not a known
          // stat/perk/effect row.
          const isStatLike = /(?:boost|defense|resistance|protection|warding|tenacity|attack speed|jump boost|penetration|cooldown)\s*[:|]/i.test(line)
          const isPerkLike = /\+\d+(?:\.\d+)?\s*$/.test(line)
          const isMultiplierLike = /\bx\s*\d+(?:\.\d+)?\s*$/i.test(line)
          if (!isStatLike && !isPerkLike && !isMultiplierLike && line.length <= 70 && i > index + 3) {
            // Don't stop on ordinary description fragments.
            if (!/[.!?]$/.test(line) && !stopRe.test(line)) break
          }
        }
        block.push(line)
      }

      const fakePage = {
        title: name,
        url: page.url,
        plain: block.join('\n'),
        rawLines: block,
        tables: [],
        infobox: [],
        sections: [{ heading: name, text: block.join(' ') }],
      }
      const parsed = extractWikiStatsAndPerks(fakePage)
      const hasData = Object.keys(parsed.stats).length > 0 || parsed.perks.length > 0 || parsed.multipliers.length > 0
      if (!hasData) continue

      return {
        name,
        wikiUrl: page.url,
        slotType,
        stats: parsed.stats,
        perks: parsed.perks,
        multipliers: parsed.multipliers,
        evidence: parsed.evidence,
        verified: true,
        source: `Voxlblade Wiki (${page.title})`,
        matchScore: 1,
        resolvedAs: name,
      }
    } catch {
      // Try the next aggregate page title.
    }
  }

  return null
}

async function resolveGuildFromAggregate(name, signal) {
  return resolveNamedAggregateEntry(['Guilds', 'Guild', 'Voxlblade Guilds'], name, 'guild', signal)
}

async function resolveEnchantmentFromAggregate(name, signal) {
  return resolveNamedAggregateEntry(
    ['Enchantments', 'Enchantment', 'Voxlblade Enchantments'],
    name,
    'enchantment',
    signal,
  )
}

async function resolveShrineFromAggregate(name, signal) {
  return resolveNamedAggregateEntry(
    ['Shrine of Balance', 'Shrines', 'Shrine'],
    name,
    'shrine',
    signal,
  )
}

async function resolveExactPageTitle(name, signal) {
  const title = String(name ?? '').trim()
  if (!title) return null
  try {
    const data = await api({ action: 'query', prop: 'info', titles: title, redirects: '1' }, signal)
    const pages = data?.query?.pages || {}
    const page = Object.values(pages)[0]
    if (page && !page.missing && page.title) return page.title
  } catch {
    // Exact-title API is an optimization; the normal search path remains.
  }
  return null
}

/**
 * Universal deep resolver — any exact item / race / guild / rune name.
 *
 * Strategy layers (20-years-advanced):
 *  1. Category-aware title expansion (Rune, Ring, Armor, Guild, Race…)
 *  2. Exact page fetch with stats-section scoring
 *  3. Aggregate-page extraction for Races
 *  4. Ranked multi-query wiki search
 *  5. Line-oriented stats/perk panel parser (base rank only)
 *  6. Aggressive localStorage cache
 */

export async function resolveWikiItemStats(itemName, slotLabel, signal) {
  const query = String(itemName ?? '').trim()
  if (!query) return null

  const category = wikiCategoryForSlot(slotLabel)
  const info = smartNormalizeQuery(query, slotLabel, category)
  const cacheKey = `stats-resolve-v10:${category}:${normalize(slotLabel)}:${normalize(query)}`
  const cached = getCached(cacheKey)
  if (cached !== null && cached !== undefined) return cached

  try {
    // ---- Exact-title fast path ----
    // This is the highest-confidence route. It prevents a short name such as
    // "Galactic" from being matched to an unrelated page just because it
    // shares a token with it.
    const exactTitle = await resolveExactPageTitle(query, signal)
    if (exactTitle) {
      const exactPage = await fetchPage(exactTitle, signal)
      if (exactPage) {
        const parsedExact = extractWikiStatsAndPerks(exactPage)
        const hasExactData =
          Object.keys(parsedExact.stats).length > 0 ||
          parsedExact.perks.length > 0 ||
          parsedExact.multipliers.length > 0

        // An exact page is valid even when it is a pure info/perk page; don't
        // force it through fuzzy item ranking.
        if (hasExactData) {
          const exactResult = {
            name: exactPage.title,
            wikiUrl: exactPage.url,
            slotType: category,
            stats: parsedExact.stats,
            perks: parsedExact.perks,
            multipliers: parsedExact.multipliers || [],
            evidence: parsedExact.evidence,
            verified: true,
            source: 'Voxlblade Wiki (exact title)',
            matchScore: 1,
            matchedQuery: query,
            resolvedAs: exactPage.title,
          }
          writeCache(cacheKey, exactResult)
          return exactResult
        }
      }
    }

    // ---- Aggregate-page systems ----
    if (category === 'enchantment') {
      const aggregate = await resolveEnchantmentFromAggregate(query, signal)
      if (aggregate) {
        writeCache(cacheKey, aggregate)
        return aggregate
      }
    }
    if (category === 'guild') {
      const aggregate = await resolveGuildFromAggregate(info.base, signal)
      if (aggregate) {
        writeCache(cacheKey, aggregate)
        return aggregate
      }
    }
    if (category === 'shrine') {
      const aggregate = await resolveShrineFromAggregate(query, signal)
      if (aggregate) {
        writeCache(cacheKey, aggregate)
        return aggregate
      }
    }

    // ---- Race fast-path ----
    if (category === 'race' || /race/i.test(String(slotLabel ?? ''))) {
      try {
        const raceResult = await resolveRaceFromAggregate(info.base, signal)
        if (raceResult?.verified) {
          writeCache(cacheKey, raceResult)
          return raceResult
        }
      } catch { /* fall through */ }
    }

    let bestPage = null
    let bestScore = 0

    // ---- Phase 1: exact / cleaned title candidates (set-level for armor) ----
    const titleCandidates = buildTitleCandidates(query, slotLabel, category)
    for (const title of titleCandidates) {
      if (signal?.aborted) break
      try {
        const page = await fetchPage(title, signal)
        if (!page?.title) continue
        // Reject piece-level misspellings that somehow resolved
        const pageNorm = normalize(page.title)
        if ((info.isArmorLike || category === 'armor') &&
            ARMOR_PIECE_SUFFIXES.some((s) => pageNorm.endsWith(' ' + s) || pageNorm.endsWith(s))) {
          // If the page title is literally "Something Helmet", skip — prefer set page
          continue
        }
        const score = Math.max(
          tokenSimilarity(info.base, page.title),
          tokenSimilarity(query, page.title),
          tokenSimilarity(info.base, title),
        )
        const parsedCandidate = extractWikiStatsAndPerks(page)
        const hasStats = Object.keys(parsedCandidate.stats).length > 0 ||
          parsedCandidate.perks.length > 0 || parsedCandidate.multipliers.length > 0
        const adjusted = score + (hasStats ? 0.14 : 0)
        if (adjusted > bestScore) {
          bestScore = adjusted
          bestPage = page
        }
        if (score >= 0.94 && hasStats) break
      } catch { /* missing */ }
    }

    // ---- Phase 2: fuzzy / prefix search ("Galactic" → Galactic Graviturgy) ----
    if (!bestPage || bestScore < 0.9 || info.isPartial) {
      try {
        const fuzzy = await fuzzySearchTitles(info.base, category || (info.isArmorLike ? 'armor' : ''), signal)
        for (const hit of fuzzy.slice(0, 5)) {
          if (signal?.aborted) break
          // Skip piece-titled pages for armor
          const tn = normalize(hit.title)
          if ((info.isArmorLike || category === 'armor') &&
              ARMOR_PIECE_SUFFIXES.some((s) => tn.endsWith(' ' + s))) {
            continue
          }
          if (hit.score < 0.45) continue
          try {
            const page = await fetchPage(hit.title, signal)
            if (!page?.title) continue
            const parsedCandidate = extractWikiStatsAndPerks(page)
            const hasStats = Object.keys(parsedCandidate.stats).length > 0 ||
              parsedCandidate.perks.length > 0 || parsedCandidate.multipliers.length > 0
            const adjusted = hit.score + (hasStats ? 0.12 : 0) + (normalize(page.title).startsWith(normalize(info.base)) ? 0.15 : 0)
            if (adjusted > bestScore) {
              bestScore = adjusted
              bestPage = page
            }
            if (adjusted >= 0.95) break
          } catch { /* next */ }
        }
      } catch { /* fuzzy optional */ }
    }

    // ---- Phase 3: classic ranked search fallback ----
    if (!bestPage || bestScore < 0.85) {
      const searchQueries = [
        info.base,
        info.isArmorLike ? `${info.base} armor` : null,
        query !== info.base ? info.base : null,
        category === 'accessory' ? `${info.base} Rune` : null,
        category === 'guild' ? `${info.base} guild` : null,
        `${info.base} stats`,
      ].filter(Boolean)

      for (const q of searchQueries) {
        if (signal?.aborted) break
        try {
          const found = await searchAndFetchBest(q, category || (info.isArmorLike ? 'armor' : ''), signal)
          if (found?.best?.page && found.best.score > bestScore) {
            const candidateParsed = extractWikiStatsAndPerks(found.best.page)
            const candidateHasData = Object.keys(candidateParsed.stats).length > 0 ||
              candidateParsed.perks.length > 0 || candidateParsed.multipliers.length > 0
            if (!candidateHasData) continue
            const tn = normalize(found.best.page.title)
            if ((info.isArmorLike || category === 'armor') &&
                ARMOR_PIECE_SUFFIXES.some((s) => tn.endsWith(' ' + s))) {
              continue
            }
            bestPage = found.best.page
            bestScore = found.best.score
            if (bestScore >= 0.93) break
          }
        } catch { /* continue */ }
      }
    }

    // ---- Phase 4: race aggregate fallback ----
    if ((!bestPage || bestScore < 0.7) && (category === 'race' || !category)) {
      try {
        const raceResult = await resolveRaceFromAggregate(info.base, signal)
        if (raceResult?.verified) {
          writeCache(cacheKey, raceResult)
          return raceResult
        }
      } catch { /* ignore */ }
    }

    if (!bestPage) {
      writeCache(cacheKey, null)
      return null
    }

    const parsed = extractWikiStatsAndPerks(bestPage)
    const hasData = Object.keys(parsed.stats).length > 0 || parsed.perks.length > 0

    const result = {
      name: bestPage.title,
      wikiUrl: bestPage.url,
      slotType: category,
      stats: parsed.stats,
      perks: parsed.perks,
      evidence: parsed.evidence,
      multipliers: parsed.multipliers || [],
      verified: hasData,
      source: 'Voxlblade Wiki',
      matchScore: Math.min(1, bestScore),
      matchedQuery: query,
      resolvedAs: bestPage.title,
    }

    writeCache(cacheKey, result)
    return result
  } catch {
    return null
  }
}

/**
 * Resolve one or more enchantment names against the live Enchantments page.
 * This is intentionally separate from item resolution because the Wiki stores
 * many enchantments as entries inside the aggregate Enchantments page.
 *
 * Returns one result per independently matched enchantment.
 */
export async function resolveWikiEnchantments(raw, signal) {
  const text = String(raw ?? '').trim()
  if (!text) return []

  const page = await findSpecialPage(ENCHANTMENT_PAGE_NAMES, 'special:enchantments-v3', 'Enchantments', signal)
  const aggregate = await fetchPage(page?.title || 'Enchantments', signal)
  if (!aggregate) return []

  const linkedCandidates = (aggregate.links || [])
    .map((link) => link.title)
    .filter((title) => title && title.length <= 60)

  const lineCandidates = (aggregate.rawLines || [])
    .filter((line) => line.length >= 2 && line.length <= 40)
    .filter((line) => /^[A-Z0-9][A-Za-z0-9'’&() /+\-]*$/.test(line))
    .filter((line) => !/^(?:description|effects?|perks?|enchantments?|stats?|gallery|trivia|obtainment)$/i.test(line))

  const linked = dedupeStrings(linkedCandidates)
  const lineFallback = dedupeStrings(lineCandidates)

  const normalizedText = normalize(text)
  const matchedNames = []

  // Prefer actual Wiki link titles. This is important for compound build
  // strings: "Restored Sacrificial" should resolve to the two linked entries
  // Restored and Sacrificial rather than to a made-up combined entry.
  for (const candidate of linked.sort((a, b) => b.length - a.length)) {
    const n = normalize(candidate)
    if (!n || n.length < 2) continue
    if (!normalizedText.includes(n)) continue
    if (!matchedNames.some((name) => normalize(name) === n)) matchedNames.push(candidate)
  }

  // If the aggregate did not expose useful links, use short title-like text
  // lines as the fallback candidate source.
  if (!matchedNames.length) {
    for (const candidate of lineFallback.sort((a, b) => b.length - a.length)) {
      const n = normalize(candidate)
      if (!n || n.length < 2) continue
      if (!normalizedText.includes(n)) continue
      if (!matchedNames.some((name) => normalize(name) === n)) matchedNames.push(candidate)
    }
  }

  // If both individual names and a longer combined title were exposed,
  // prefer the individual enchantments when the raw build string contains
  // both. This prevents "Restored Sacrificial" from becoming a third fake
  // enchantment on top of Restored + Sacrificial.
  if (matchedNames.length > 2) {
    const normalizedMatches = matchedNames.map((name) => ({ name, n: normalize(name) }))
    const individual = normalizedMatches.filter((entry) =>
      normalizedMatches.some((other) =>
        other.n !== entry.n &&
        entry.n.includes(other.n) &&
        new RegExp(`\\b${escapeRegex(other.n)}\\b`).test(entry.n),
      ),
    )
    const compoundKeys = new Set(individual.map((entry) => entry.n))
    const filtered = matchedNames.filter((name) => !compoundKeys.has(normalize(name)) || matchedNames.length === 1)
    if (filtered.length) matchedNames.splice(0, matchedNames.length, ...filtered)
  }

  // If the aggregate did not expose useful names, use the normal Wiki
  // search as a fallback for the exact phrase.
  if (!matchedNames.length) {
    const results = await searchWiki(text, signal, 10).catch(() => [])
    for (const result of results) {
      if (tokenSimilarity(text, result.title) >= 0.9) matchedNames.push(result.title)
    }
  }

  const unique = []
  const seen = new Set()
  for (const name of matchedNames) {
    const key = normalize(name)
    if (seen.has(key)) continue
    seen.add(key)
    const resolved = await resolveEnchantmentFromAggregate(name, signal)
    if (resolved) unique.push(resolved)
  }
  return unique
}

export { WIKI_BASE }

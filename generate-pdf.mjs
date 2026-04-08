#!/usr/bin/env node

import { existsSync, readFileSync } from 'fs';
import { copyFile, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'fs/promises';
import { spawnSync } from 'child_process';
import { tmpdir } from 'os';
import { dirname, extname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = __dirname;
const defaultTemplate = join(projectRoot, 'templates', 'cv.typ');
const defaultFormat = 'letter';
const fallbackCvPath = join(projectRoot, 'cv.md');
const fontPath = join(projectRoot, 'fonts');
const typstFontAssets = ['dm-sans-latin.woff2', 'space-grotesk-latin.woff2'];
const outputDir = join(projectRoot, 'output');

function usage() {
  console.error('Usage: node generate-pdf.mjs <source.(md|json)> [output.pdf] [--payload=override.json] [--template=templates/cv.typ] [--format=letter|a4] [--keep-temp]');
  process.exit(1);
}

function parseArgs(argv) {
  let sourcePath = null;
  let outputPath = null;
  let payloadPath = null;
  let templatePath = defaultTemplate;
  let format = defaultFormat;
  let keepTemp = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--keep-temp') {
      keepTemp = true;
      continue;
    }
    if (arg === '--format' || arg === '--payload' || arg === '--template') {
      const value = argv[i + 1];
      if (!value) usage();
      if (arg === '--format') format = value.toLowerCase();
      if (arg === '--payload') payloadPath = value;
      if (arg === '--template') templatePath = value;
      i += 1;
      continue;
    }
    if (arg.startsWith('--format=')) {
      format = arg.split('=')[1].toLowerCase();
      continue;
    }
    if (arg.startsWith('--payload=')) {
      payloadPath = arg.split('=')[1];
      continue;
    }
    if (arg.startsWith('--template=')) {
      templatePath = arg.split('=')[1];
      continue;
    }
    if (!sourcePath) {
      sourcePath = arg;
      continue;
    }
    if (!outputPath) {
      outputPath = arg;
      continue;
    }
    usage();
  }

  if (!sourcePath) usage();
  if (!['a4', 'letter'].includes(format)) {
    throw new Error(`Invalid format "${format}". Use letter or a4.`);
  }

  return {
    sourcePath: resolve(sourcePath),
    outputPath: outputPath ? resolve(outputPath) : null,
    payloadPath: payloadPath ? resolve(payloadPath) : null,
    templatePath: resolve(templatePath),
    format,
    keepTemp,
  };
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function defaultOutputFilename(data, sourcePath) {
  const companySlug = slugify(data?.meta?.company);
  if (companySlug) {
    return `cv-candidate-${companySlug}-${todayString()}.pdf`;
  }
  const candidateSlug = slugify(data?.meta?.candidate_name || data?.identity?.full_name);
  if (candidateSlug) {
    return `cv-${candidateSlug}.pdf`;
  }
  const sourceSlug = slugify(sourcePath ? sourcePath.split('/').pop().replace(extname(sourcePath), '') : '');
  return `${sourceSlug || 'cv-output'}.pdf`;
}

async function resolveOutputPath(outputPath, data, sourcePath) {
  if (!outputPath) {
    const outputDir = join(projectRoot, 'output');
    await mkdir(outputDir, { recursive: true });
    return join(outputDir, defaultOutputFilename(data, sourcePath));
  }
  const resolved = resolve(outputPath);
  if (extname(resolved).toLowerCase() === '.pdf') {
    return resolved;
  }
  await mkdir(resolved, { recursive: true });
  return join(resolved, defaultOutputFilename(data, sourcePath));
}

function normalizeTextForATS(value) {
  if (typeof value === 'string') {
    return value
      .replace(/\u2014/g, '-')
      .replace(/\u2013/g, '-')
      .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
      .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
      .replace(/\u2026/g, '...')
      .replace(/[\u200B\u200C\u200D\u2060\uFEFF]/g, '')
      .replace(/\u00A0/g, ' ');
  }
  if (Array.isArray(value)) {
    return value.map(normalizeTextForATS);
  }
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, nested] of Object.entries(value)) {
      out[key] = normalizeTextForATS(nested);
    }
    return out;
  }
  return value;
}

function toAbsoluteUrl(url) {
  if (!url) return null;
  if (/^(https?:\/\/|mailto:)/i.test(url)) return url;
  return `https://${String(url).replace(/^\/+/, '')}`;
}

function parseContactField(label, value) {
  const clean = String(value || '').trim();
  if (!clean) return null;
  if (label === 'email') {
    return { display: clean, href: `mailto:${clean}` };
  }
  if (label === 'linkedin' || label === 'portfolio' || label === 'github') {
    return {
      display: clean.replace(/^https?:\/\//i, ''),
      href: toAbsoluteUrl(clean),
    };
  }
  return { display: clean, href: null };
}

function emptyRenderData() {
  return {
    meta: {
      candidate_name: '',
      company: '',
      role: '',
      language: 'en',
      paper_size: defaultFormat,
      source_jd: '',
      source_report: '',
    },
    identity: {
      full_name: '',
      location: '',
      contacts: [],
    },
    summary: '',
    core_competencies: [],
    experience: [],
    projects: [],
    education: [],
    certifications: [],
    skills: [],
  };
}

function findHeading(lines, title) {
  return lines.findIndex((line) => line.trim() === `## ${title}`);
}

function sliceSection(lines, startHeadingIndex, endHeadingIndex) {
  if (startHeadingIndex === undefined || startHeadingIndex === -1) return [];
  const end = endHeadingIndex === undefined || endHeadingIndex === -1 ? lines.length : endHeadingIndex;
  return lines.slice(startHeadingIndex + 1, end).map((line) => line.trim()).filter(Boolean);
}

function joinParagraphs(lines) {
  return lines.join(' ').replace(/\s+/g, ' ').trim();
}

function buildContacts(contactMap) {
  const order = [
    ['email', contactMap.email],
    ['linkedin', contactMap.linkedin],
    ['portfolio', contactMap.portfolio],
  ];
  return order.map(([label, value]) => parseContactField(label, value)).filter(Boolean);
}

function parseWorkExperience(lines, startIndex, endIndex) {
  if (startIndex === undefined || startIndex === -1) return [];
  const end = endIndex === undefined || endIndex === -1 ? lines.length : endIndex;
  const section = lines.slice(startIndex + 1, end);
  const jobs = [];
  let current = null;
  let state = 'waiting';

  for (const rawLine of section) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith('### ')) {
      if (current) jobs.push(current);
      const companyLine = line.slice(4).trim();
      const companyParts = companyLine.split(' -- ');
      current = {
        company: companyParts[0].trim(),
        location: companyParts.slice(1).join(' -- ').trim(),
        role: '',
        period: '',
        bullets: [],
      };
      state = 'role';
      continue;
    }
    if (!current) continue;
    if (state === 'role' && line.startsWith('**') && line.endsWith('**')) {
      current.role = line.replace(/^\*\*|\*\*$/g, '').trim();
      state = 'period';
      continue;
    }
    if (state === 'period') {
      current.period = line.replace(/\s+/g, ' ').trim();
      state = 'bullets';
      continue;
    }
    if (line.startsWith('- ')) {
      current.bullets.push(line.slice(2).trim());
      state = 'bullets';
      continue;
    }
    if (current.bullets.length > 0) {
      current.bullets[current.bullets.length - 1] = `${current.bullets[current.bullets.length - 1]} ${line}`.trim();
    }
  }

  if (current) jobs.push(current);
  return jobs.map((job) => ({
    ...job,
    bullets: job.bullets.slice(0, 3),
  }));
}

function parseProjects(lines, startIndex, endIndex) {
  const section = sliceSection(lines, startIndex, endIndex);
  if (section.length === 0) return [];
  const projects = [];
  for (const line of section) {
    if (!line.startsWith('- ')) continue;
    const text = line.slice(2).trim();
    const parsed = text.match(/^\*\*(.+?)\*\*(?:\s*\((.+?)\))?\s*--\s*(.+)$/);
    if (parsed) {
      projects.push({
        title: parsed[1].trim(),
        badge: parsed[2]?.trim() || '',
        description: parsed[3].trim(),
        tech: '',
      });
      continue;
    }
    projects.push({
      title: text,
      badge: '',
      description: '',
      tech: '',
    });
  }
  return projects;
}

function parseEducation(lines, startIndex, endIndex) {
  const section = sliceSection(lines, startIndex, endIndex);
  const items = [];
  for (const line of section) {
    if (!line.startsWith('- ')) continue;
    const raw = line.slice(2).trim();
    const match = raw.match(/^(.*)\(([^()]+)\)\s*$/);
    const beforeYear = (match ? match[1] : raw).trim().replace(/\s+,/g, ',');
    const year = match ? match[2].trim() : '';
    const parts = beforeYear.split(',').map((part) => part.trim()).filter(Boolean);
    items.push({
      title: parts.length > 1 ? parts.slice(0, -1).join(', ') : beforeYear,
      institution: parts.length > 1 ? parts[parts.length - 1] : '',
      year,
      description: '',
    });
  }
  return items;
}

function parseSimpleBullets(lines, startIndex, endIndex) {
  return sliceSection(lines, startIndex, endIndex)
    .filter((line) => line.startsWith('- '))
    .map((line) => line.slice(2).trim())
    .map((title) => ({ title, issuer: '', year: '' }));
}

function parseSkills(lines, startIndex, endIndex) {
  const section = sliceSection(lines, startIndex, endIndex);
  const items = [];
  for (const line of section) {
    const match = line.match(/^(.+?):\s*(.+)$/);
    if (!match) continue;
    items.push({
      category: match[1].trim(),
      items: match[2]
        .replace(/\.$/, '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    });
  }
  return items;
}

function deriveCompetencies(skills, experience) {
  const competencySet = new Set();
  const skillCategories = skills.map((skill) => String(skill.category || '').toLowerCase());
  const experienceText = experience.flatMap((job) => [job.role, job.company, ...job.bullets]).join(' ').toLowerCase();

  if (skillCategories.some((item) => item.includes('ci/cd') || item.includes('automation'))) competencySet.add('CI/CD Automation');
  if (skillCategories.some((item) => item.includes('cloud') || item.includes('infrastructure'))) competencySet.add('Cloud Infrastructure');
  if (skillCategories.some((item) => item.includes('development'))) competencySet.add('Backend Delivery');
  if (experienceText.includes('terraform')) competencySet.add('Infrastructure as Code');
  if (experienceText.includes('reliability') || experienceText.includes('pipeline')) competencySet.add('Production Reliability');
  if (experienceText.includes('sql server') || experienceText.includes('postgresql')) competencySet.add('Database Performance');
  if (experienceText.includes('debugging') || experienceText.includes('incident')) competencySet.add('Operational Debugging');
  if (experienceText.includes('deployment') || experienceText.includes('release')) competencySet.add('Release Engineering');

  const fallback = [
    'Platform Ownership',
    'Infrastructure Automation',
    'Incident Response',
    'Systems Reliability',
  ];
  const competencies = Array.from(competencySet);
  for (const item of fallback) {
    if (competencies.length >= 8) break;
    if (!competencies.includes(item)) competencies.push(item);
  }
  return competencies.slice(0, 8);
}

function parseCvMarkdown(content) {
  const lines = content.split(/\r?\n/);
  const titleLine = lines.find((line) => /^#\s/.test(line)) || '# CV -- Candidate';
  const titleMatch = titleLine.match(/^#\s+CV\s+--\s+(.+)$/i) || titleLine.match(/^#\s+(.+)$/);
  const fullName = titleMatch ? titleMatch[1].trim() : 'Candidate';

  const headingIndexes = [
    ['Professional Summary', findHeading(lines, 'Professional Summary')],
    ['Work Experience', findHeading(lines, 'Work Experience')],
    ['Projects', findHeading(lines, 'Projects')],
    ['Education', findHeading(lines, 'Education')],
    ['Certifications', findHeading(lines, 'Certifications')],
    ['Skills', findHeading(lines, 'Skills')],
  ].filter(([, index]) => index !== -1).sort((a, b) => a[1] - b[1]);

  const headings = Object.fromEntries(headingIndexes);
  const firstContentHeading = headingIndexes[0]?.[1] ?? lines.length;
  const contactLines = lines.slice(1, firstContentHeading).filter((line) => line.trim().length > 0);
  const contactMap = {};
  for (const line of contactLines) {
    const match = line.match(/^\*\*([^*]+):\*\*\s*(.+)$/);
    if (!match) continue;
    contactMap[match[1].trim().toLowerCase()] = match[2].trim();
  }

  const summary = sliceSection(lines, headings['Professional Summary'], headings['Work Experience']);
  const workExperience = parseWorkExperience(lines, headings['Work Experience'], headings['Projects'] ?? headings['Education']);
  const projects = headings['Projects'] !== undefined ? parseProjects(lines, headings['Projects'], headings['Education']) : [];
  const education = parseEducation(lines, headings['Education'], headings['Certifications'] ?? headings['Skills'] ?? lines.length);
  const certifications = headings['Certifications'] !== undefined
    ? parseSimpleBullets(lines, headings['Certifications'], headings['Skills'] ?? lines.length)
    : [];
  const skills = parseSkills(lines, headings['Skills'] ?? lines.length, lines.length);

  return normalizeTextForATS({
    meta: {
      candidate_name: fullName,
      company: '',
      role: '',
      language: 'en',
      paper_size: defaultFormat,
      source_jd: '',
      source_report: '',
    },
    identity: {
      full_name: fullName,
      location: contactMap.location || '',
      contacts: buildContacts(contactMap),
    },
    summary: joinParagraphs(summary),
    core_competencies: deriveCompetencies(skills, workExperience),
    experience: workExperience,
    projects,
    education,
    certifications,
    skills,
  });
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeStringArray(values) {
  if (!Array.isArray(values)) return [];
  const seen = new Set();
  const items = [];
  for (const value of values) {
    const clean = normalizeString(value);
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(clean);
  }
  return items;
}

function normalizeContacts(values) {
  if (!Array.isArray(values)) return [];
  return values
    .map((value) => {
      if (typeof value === 'string') return { display: value.trim(), href: null };
      if (!value || typeof value !== 'object') return null;
      return {
        display: normalizeString(value.display),
        href: normalizeString(value.href),
      };
    })
    .filter((value) => value && value.display);
}

function normalizeMeta(meta, fallback) {
  return {
    candidate_name: normalizeString(meta?.candidate_name || fallback?.meta?.candidate_name || fallback?.identity?.full_name),
    company: normalizeString(meta?.company || fallback?.meta?.company),
    role: normalizeString(meta?.role || fallback?.meta?.role),
    language: normalizeString(meta?.language || fallback?.meta?.language) || 'en',
    paper_size: normalizeString(meta?.paper_size || fallback?.meta?.paper_size) || defaultFormat,
    source_jd: normalizeString(meta?.source_jd || fallback?.meta?.source_jd),
    source_report: normalizeString(meta?.source_report || fallback?.meta?.source_report),
  };
}

function normalizeIdentity(identity, meta, fallback) {
  return {
    full_name: normalizeString(identity?.full_name || meta?.candidate_name || fallback?.identity?.full_name),
    location: normalizeString(identity?.location || fallback?.identity?.location),
    contacts: normalizeContacts(identity?.contacts || fallback?.identity?.contacts),
  };
}

function normalizeExperience(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      return {
        company: normalizeString(item.company),
        location: normalizeString(item.location),
        role: normalizeString(item.role),
        period: normalizeString(item.period),
        bullets: normalizeStringArray(item.bullets).slice(0, 3),
      };
    })
    .filter((item) => item && (item.company || item.role || item.bullets.length > 0));
}

function normalizeProjects(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      return {
        title: normalizeString(item.title),
        badge: normalizeString(item.badge),
        description: normalizeString(item.description),
        tech: normalizeString(item.tech),
      };
    })
    .filter((item) => item && (item.title || item.description));
}

function normalizeEducation(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      return {
        title: normalizeString(item.title),
        institution: normalizeString(item.institution),
        year: normalizeString(item.year || item.dates),
        description: normalizeString(item.description),
      };
    })
    .filter((item) => item && (item.title || item.institution));
}

function normalizeCertifications(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      if (typeof item === 'string') {
        return { title: normalizeString(item), issuer: '', year: '' };
      }
      if (!item || typeof item !== 'object') return null;
      return {
        title: normalizeString(item.title || item.display),
        issuer: normalizeString(item.issuer),
        year: normalizeString(item.year),
      };
    })
    .filter((item) => item && item.title);
}

function normalizeSkills(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      if (Array.isArray(item.items)) {
        return {
          category: normalizeString(item.category),
          items: normalizeStringArray(item.items),
        };
      }
      const display = normalizeString(item.display);
      return {
        category: normalizeString(item.category),
        items: display ? display.split(',').map((value) => value.trim()).filter(Boolean) : [],
      };
    })
    .filter((item) => item && item.category && item.items.length > 0);
}

function normalizeLegacyPayload(input, fallback) {
  const meta = normalizeMeta({
    candidate_name: input.identity?.full_name || input.meta?.candidate_name,
    language: input.document?.lang || input.meta?.language,
    paper_size: input.document?.format || input.meta?.paper_size,
    company: input.meta?.company,
    role: input.meta?.role,
    source_jd: input.meta?.source_jd,
    source_report: input.meta?.source_report,
  }, fallback);

  return {
    meta,
    identity: normalizeIdentity(input.identity, meta, fallback),
    summary: normalizeString(input.summary || fallback.summary),
    core_competencies: normalizeStringArray(input.competencies || input.core_competencies || fallback.core_competencies),
    experience: normalizeExperience(input.experience || fallback.experience),
    projects: normalizeProjects(input.projects || fallback.projects),
    education: normalizeEducation(input.education || fallback.education),
    certifications: normalizeCertifications(input.certifications || fallback.certifications),
    skills: normalizeSkills(input.skills || fallback.skills),
  };
}

function normalizeWorkerPayload(input, fallback) {
  const meta = normalizeMeta(input.meta, fallback);
  return {
    meta,
    identity: normalizeIdentity(input.identity, meta, fallback),
    summary: normalizeString(input.summary || fallback.summary),
    core_competencies: normalizeStringArray(input.core_competencies || fallback.core_competencies),
    experience: normalizeExperience(input.experience || fallback.experience),
    projects: normalizeProjects(input.projects || fallback.projects),
    education: normalizeEducation(input.education || fallback.education),
    certifications: normalizeCertifications(input.certifications || fallback.certifications),
    skills: normalizeSkills(input.skills || fallback.skills),
  };
}

function normalizePayloadInput(input, fallback = emptyRenderData()) {
  if (!input || typeof input !== 'object') return emptyRenderData();
  if ('document' in input || 'competencies' in input || 'has_projects' in input || 'has_certifications' in input) {
    return normalizeLegacyPayload(input, fallback);
  }
  return normalizeWorkerPayload(input, fallback);
}

function mergeDeep(base, override) {
  if (Array.isArray(base) && Array.isArray(override)) {
    return override;
  }
  if (base && typeof base === 'object' && override && typeof override === 'object' && !Array.isArray(base) && !Array.isArray(override)) {
    const out = { ...base };
    for (const [key, value] of Object.entries(override)) {
      out[key] = key in base ? mergeDeep(base[key], value) : value;
    }
    return out;
  }
  return override === undefined ? base : override;
}

function finalizeRenderData(input, format) {
  const data = mergeDeep(emptyRenderData(), normalizeTextForATS(input || {}));
  data.meta = normalizeMeta(data.meta, data);
  data.identity = normalizeIdentity(data.identity, data.meta, data);
  data.meta.paper_size = format || data.meta.paper_size || defaultFormat;
  data.meta.candidate_name = data.meta.candidate_name || data.identity.full_name || 'Candidate';
  data.identity.full_name = data.identity.full_name || data.meta.candidate_name || 'Candidate';
  data.summary = normalizeString(data.summary);
  data.core_competencies = normalizeStringArray(data.core_competencies);
  data.experience = normalizeExperience(data.experience);
  data.projects = normalizeProjects(data.projects);
  data.education = normalizeEducation(data.education);
  data.certifications = normalizeCertifications(data.certifications);
  data.skills = normalizeSkills(data.skills);
  if (data.core_competencies.length === 0) {
    data.core_competencies = deriveCompetencies(data.skills, data.experience);
  }
  return data;
}

async function readJsonIfExists(pathname) {
  if (!pathname) return null;
  const raw = await readFile(pathname, 'utf8');
  return JSON.parse(raw);
}

async function loadSourceData(sourcePath, format) {
  const ext = extname(sourcePath).toLowerCase();
  if (ext === '.md') {
    const content = await readFile(sourcePath, 'utf8');
    return finalizeRenderData(parseCvMarkdown(content), format);
  }
  if (ext === '.json') {
    const override = await readJsonIfExists(sourcePath);
    const base = existsSync(fallbackCvPath)
      ? finalizeRenderData(parseCvMarkdown(await readFile(fallbackCvPath, 'utf8')), format)
      : finalizeRenderData(emptyRenderData(), format);
    return finalizeRenderData(mergeDeep(base, normalizePayloadInput(override, base)), format);
  }
  throw new Error(`Unsupported source file "${sourcePath}". Use cv.md or a JSON payload.`);
}

async function writeTempPayload(payload) {
  const tempDir = await mkdtemp(join(tmpdir(), 'career-ops-typst-'));
  const payloadPath = join(tempDir, 'payload.json');
  await writeFile(payloadPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return { tempDir, payloadPath };
}

function maybeCollectTransientJson(jsonPath, pdfPath) {
  if (!jsonPath) return null;
  if (extname(jsonPath).toLowerCase() !== '.json') return null;
  if (!existsSync(jsonPath)) return null;
  const resolvedJson = resolve(jsonPath);
  const resolvedPdf = resolve(pdfPath);
  if (!resolvedJson.startsWith(`${outputDir}/`)) return null;
  const jsonStem = resolvedJson.slice(0, -5);
  const pdfStem = extname(resolvedPdf).toLowerCase() === '.pdf' ? resolvedPdf.slice(0, -4) : resolvedPdf;
  if (jsonStem !== pdfStem) return null;
  return resolvedJson;
}

async function prepareTempFonts(tempDir) {
  for (const file of typstFontAssets) {
    const source = join(fontPath, file);
    if (!existsSync(source)) continue;
    const copied = join(tempDir, file);
    await copyFile(source, copied);
    const result = spawnSync('woff2_decompress', [copied], {
      stdio: 'pipe',
    });
    if (result.status !== 0) {
      console.warn(`⚠️  Failed to unpack font: ${file}`);
      continue;
    }
    const ttfPath = copied.replace(/\.woff2$/i, '.ttf');
    const staticPath = ttfPath.replace(/\.ttf$/i, '.static.ttf');
    const instancerArgs = file.startsWith('dm-sans')
      ? ['varLib.instancer', ttfPath, '--static', '--update-name-table', 'wght=400', 'opsz=9', '--output', staticPath]
      : ['varLib.instancer', ttfPath, '--static', '--update-name-table', 'wght=700', '--output', staticPath];
    const staticResult = spawnSync('fonttools', instancerArgs, {
      stdio: 'pipe',
    });
    if (staticResult.status === 0 && existsSync(staticPath)) {
      await rm(ttfPath, { force: true });
      await rm(copied, { force: true });
    }
  }
}

function countPdfPages(pdfPath) {
  const buffer = readFileSync(pdfPath);
  const text = buffer.toString('latin1');
  return (text.match(/\/Type\s*\/Page[^s]/g) || []).length;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!existsSync(args.templatePath)) throw new Error(`Typst template not found: ${args.templatePath}`);
  if (!existsSync(args.sourcePath)) throw new Error(`Source file not found: ${args.sourcePath}`);
  if (args.payloadPath && !existsSync(args.payloadPath)) throw new Error(`Payload file not found: ${args.payloadPath}`);

  console.log(`📄 Source:   ${args.sourcePath}`);
  console.log(`🧩 Format:   ${args.format.toUpperCase()}`);
  console.log(`🧱 Template: ${args.templatePath}`);

  let data = await loadSourceData(args.sourcePath, args.format);
  if (args.payloadPath) {
    const override = normalizePayloadInput(await readJsonIfExists(args.payloadPath), data);
    data = finalizeRenderData(mergeDeep(data, override), args.format);
  }

  args.outputPath = await resolveOutputPath(args.outputPath, data, args.sourcePath);
  console.log(`📁 Output:   ${args.outputPath}`);

  const transientJsonPaths = Array.from(new Set([
    maybeCollectTransientJson(args.sourcePath, args.outputPath),
    maybeCollectTransientJson(args.payloadPath, args.outputPath),
  ].filter(Boolean)));

  const { tempDir, payloadPath } = await writeTempPayload(data);
  let compiled = false;
  try {
    await prepareTempFonts(tempDir);
    await mkdir(dirname(args.outputPath), { recursive: true });
    const result = spawnSync('typst', ['compile', args.templatePath, args.outputPath, '--root', '/', '--font-path', tempDir, '--font-path', fontPath, '--input', `payload=${payloadPath}`], {
      stdio: 'inherit',
    });
    if (result.status !== 0) {
      throw new Error(`typst compile failed with exit code ${result.status ?? 'unknown'}`);
    }
    compiled = true;
    const pageCount = countPdfPages(args.outputPath);
    const { size } = await stat(args.outputPath);
    console.log(`✅ PDF generated: ${args.outputPath}`);
    console.log(`📊 Pages: ${pageCount}`);
    console.log(`📦 Size: ${(size / 1024).toFixed(1)} KB`);
  } finally {
    if (compiled && !args.keepTemp) {
      await Promise.all(transientJsonPaths.map((pathname) => rm(pathname, { force: true })));
    }
    if (!args.keepTemp) {
      await rm(tempDir, { recursive: true, force: true });
    } else {
      console.log(`🧪 Temp files kept at: ${tempDir}`);
    }
  }
}

main().catch((err) => {
  console.error(`❌ PDF generation failed: ${err.message}`);
  process.exit(1);
});

#!/usr/bin/env node

import { readFile, writeFile, appendFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PIPELINE_FILE = join(ROOT, 'data/pipeline.md');
const SCAN_HISTORY_FILE = join(ROOT, 'data/scan-history.tsv');
const APPLICATIONS_FILE = existsSync(join(ROOT, 'data/applications.md'))
  ? join(ROOT, 'data/applications.md')
  : join(ROOT, 'applications.md');
const JDS_DIR = join(ROOT, 'jds');

const EXPIRED_PATTERNS = [
  /job (is )?no longer available/i,
  /job.*no longer open/i,
  /position has been filled/i,
  /this job has expired/i,
  /job posting has expired/i,
  /no longer accepting applications/i,
  /this (position|role|job) (is )?no longer/i,
  /this job (listing )?is closed/i,
  /job (listing )?not found/i,
  /the page you are looking for doesn.t exist/i,
  /page not found/i,
];

const BLOCKED_PATTERNS = [
  /request blocked/i,
  /you have been blocked/i,
  /cloudflare/i,
  /ray id/i,
];

function usage() {
  console.error('Usage: node resolve-indeed.mjs <indeed-url> [more-urls] [--file urls.txt] [--add-to-pipeline] [--json]');
  process.exit(1);
}

function parseArgs(argv) {
  const args = [...argv];
  const flags = {
    addToPipeline: false,
    json: false,
    file: null,
    keepLead: false,
    title: '',
    company: '',
    queryName: 'Indeed Resolver',
  };
  const urls = [];

  while (args.length > 0) {
    const arg = args.shift();
    if (arg === '--add-to-pipeline') {
      flags.addToPipeline = true;
      continue;
    }
    if (arg === '--json') {
      flags.json = true;
      continue;
    }
    if (arg === '--keep-lead') {
      flags.keepLead = true;
      continue;
    }
    if (arg === '--file') {
      flags.file = args.shift() ?? null;
      continue;
    }
    if (arg === '--title') {
      flags.title = args.shift() ?? '';
      continue;
    }
    if (arg === '--company') {
      flags.company = args.shift() ?? '';
      continue;
    }
    if (arg === '--query-name') {
      flags.queryName = args.shift() ?? 'Indeed Resolver';
      continue;
    }
    urls.push(arg);
  }

  return { flags, urls };
}

async function loadUrls({ flags, urls }) {
  if (flags.file) {
    const text = await readFile(flags.file, 'utf8');
    urls.push(...text.split('\n').map(line => line.trim()).filter(Boolean));
  }
  return urls;
}

function normalizeText(value) {
  return value
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function normalizeKey(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'indeed-job';
}

function extractIndeedJobId(rawUrl) {
  try {
    const url = new URL(rawUrl);
    if (!/indeed\.com$/i.test(url.hostname)) {
      return null;
    }
    const jk = url.searchParams.get('jk');
    if (jk) {
      return jk;
    }
    const vjk = url.searchParams.get('vjk');
    if (vjk) {
      return vjk;
    }
    const match = rawUrl.match(/[?&](?:jk|vjk)=([a-z0-9]+)/i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function canonicalIndeedUrl(rawUrl, jobId) {
  const host = (() => {
    try {
      return new URL(rawUrl).origin;
    } catch {
      return 'https://ca.indeed.com';
    }
  })();
  return `${host}/viewjob?jk=${jobId}`;
}

function parseMarkdownTableRows(content) {
  const rows = [];
  for (const line of content.split('\n')) {
    if (!line.startsWith('|')) continue;
    if (line.includes('---')) continue;
    const parts = line.split('|').map(part => part.trim());
    if (parts.length < 9) continue;
    const num = Number(parts[1]);
    if (Number.isNaN(num)) continue;
    rows.push({
      company: parts[3],
      role: parts[4],
    });
  }
  return rows;
}

async function loadDedupState() {
  const [pipeline, scanHistory, applications] = await Promise.all([
    readFile(PIPELINE_FILE, 'utf8'),
    readFile(SCAN_HISTORY_FILE, 'utf8'),
    readFile(APPLICATIONS_FILE, 'utf8'),
  ]);

  const pipelineLines = pipeline.split('\n').filter(line => /^- \[[ x!?]\]/.test(line));
  const pipelineUrls = new Set();
  const pipelineCompanyRole = new Set();

  for (const line of pipelineLines) {
    const parts = line.split('|').map(part => part.trim());
    if (parts.length >= 3) {
      const left = parts[0].replace(/^- \[[ x!?]\]\s*/, '').replace(/^#\d+\s*/, '').trim();
      pipelineUrls.add(left);
      if (parts.length >= 3) {
        const company = parts[1]?.replace(/^#\d+\s*/, '').trim();
        const role = parts[2]?.trim();
        if (company && role) {
          pipelineCompanyRole.add(`${normalizeKey(company)}::${normalizeKey(role)}`);
        }
      }
      if (parts.length >= 4) {
        const company = parts[2]?.trim();
        const role = parts[3]?.trim();
        if (company && role) {
          pipelineCompanyRole.add(`${normalizeKey(company)}::${normalizeKey(role)}`);
        }
      }
    }
  }

  const scanUrls = new Set(
    scanHistory
      .split('\n')
      .slice(1)
      .map(line => line.split('\t')[0]?.trim())
      .filter(Boolean),
  );

  const applicationsCompanyRole = new Set(
    parseMarkdownTableRows(applications).map(row => `${normalizeKey(row.company)}::${normalizeKey(row.role)}`),
  );

  return {
    pipelineRaw: pipeline,
    pipelineUrls,
    pipelineCompanyRole,
    scanUrls,
    applicationsCompanyRole,
  };
}

async function extractJob(page, canonicalUrl, sourceUrl) {
  const response = await page.goto(canonicalUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(2500);

  const result = await page.evaluate(() => {
    const text = selector => document.querySelector(selector)?.textContent?.trim() ?? '';
    const html = selector => document.querySelector(selector)?.innerText?.trim() ?? '';
    const meta = (property, attr = 'property') => document.querySelector(`meta[${attr}="${property}"]`)?.getAttribute('content')?.trim() ?? '';
    const links = Array.from(document.querySelectorAll('a[href]')).map(anchor => ({
      text: (anchor.textContent || '').trim(),
      href: anchor.href,
    }));

    const jsonLdObjects = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      .flatMap(script => {
        try {
          const parsed = JSON.parse(script.textContent || 'null');
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          return [];
        }
      })
      .filter(Boolean);

    const jobPosting = jsonLdObjects.find(item => item['@type'] === 'JobPosting') || null;
    const hiringOrg = jobPosting?.hiringOrganization;
    const place = Array.isArray(jobPosting?.jobLocation) ? jobPosting?.jobLocation?.[0] : jobPosting?.jobLocation;
    const address = place?.address;

    const title =
      text('[data-testid="jobsearch-JobInfoHeader-title"]') ||
      text('h1.jobsearch-JobInfoHeader-title') ||
      text('h1') ||
      meta('og:title') ||
      jobPosting?.title ||
      document.title;

    const company =
      text('[data-testid="inlineHeader-companyName"]') ||
      text('[data-testid="company-name"]') ||
      text('[data-company-name="true"]') ||
      hiringOrg?.name ||
      '';

    const location =
      text('[data-testid="job-location"]') ||
      text('[data-testid="inlineHeader-companyLocation"]') ||
      [address?.addressLocality, address?.addressRegion, address?.addressCountry].filter(Boolean).join(', ');

    const description =
      html('#jobDescriptionText') ||
      html('[data-testid="jobsearch-JobComponent-description"]') ||
      html('.jobsearch-JobComponent-description') ||
      normalizeWhitespace(jobPosting?.description || '');

    const applyCandidate = links.find(link => /apply|postuler|bewerben|solicitar/i.test(link.text) && !/indeed\.com/i.test(link.href));

    return {
      title,
      company,
      location,
      description,
      applyUrl: applyCandidate?.href || jobPosting?.url || '',
      bodyText: document.body?.innerText ?? '',
      finalUrl: location.href,
    };

    function normalizeWhitespace(value) {
      return String(value || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
  });

  const statusCode = response?.status() ?? 0;
  const bodyText = normalizeText(result.bodyText || '');
  const title = normalizeText(result.title || '').replace(/\s+[|@—–-]\s+Indeed.*$/i, '').replace(/^blocked\s*-\s*indeed\.com$/i, '').trim();
  const company = normalizeText(result.company || '');
  const location = normalizeText(result.location || '');
  const description = normalizeText(result.description || '');
  const finalUrl = result.finalUrl || canonicalUrl;

  const blockedReason = BLOCKED_PATTERNS.find(pattern => pattern.test(bodyText));
  if (blockedReason) {
    return {
      status: 'blocked',
      canonicalUrl,
      sourceUrl,
      finalUrl,
      reason: `blocked by Indeed/Cloudflare: ${blockedReason.source}`,
    };
  }

  const expiredReason = EXPIRED_PATTERNS.find(pattern => pattern.test(bodyText));
  if (statusCode === 404 || statusCode === 410 || expiredReason) {
    return {
      status: 'expired',
      canonicalUrl,
      sourceUrl,
      finalUrl,
      reason: statusCode === 404 || statusCode === 410 ? `HTTP ${statusCode}` : `pattern matched: ${expiredReason.source}`,
    };
  }

  const enoughContent = bodyText.length >= 300 || description.length >= 200;
  if (!title || !company || !enoughContent) {
    return {
      status: 'unresolved',
      canonicalUrl,
      sourceUrl,
      finalUrl,
      title,
      company,
      location,
      reason: 'insufficient structured detail',
    };
  }

  const confidence = description.length >= 800 ? 'high' : description.length >= 300 ? 'medium' : 'low';

  return {
    status: 'resolved',
    canonicalUrl,
    sourceUrl,
    finalUrl,
    title,
    company,
    location,
    description,
    applyUrl: result.applyUrl || '',
    confidence,
  };
}

function renderJdMarkdown(job) {
  const lines = [
    `# ${job.title}`,
    '',
    `**Source:** Indeed`,
    `**Canonical URL:** ${job.canonicalUrl}`,
    `**Original URL:** ${job.sourceUrl}`,
    `**Company:** ${job.company}`,
  ];

  if (job.location) {
    lines.push(`**Location:** ${job.location}`);
  }
  if (job.applyUrl) {
    lines.push(`**Apply URL:** ${job.applyUrl}`);
  }
  lines.push(`**Extraction Confidence:** ${job.confidence}`);
  lines.push(`**Extracted:** ${new Date().toISOString().slice(0, 10)}`);
  lines.push('');
  lines.push('## Job Description');
  lines.push('');
  lines.push(job.description);
  lines.push('');
  return lines.join('\n');
}

async function writeJobFile(job) {
  await mkdir(JDS_DIR, { recursive: true });
  const slug = slugify(`${job.company}-${job.title}`);
  const filename = `indeed-${job.jobId}-${slug}.md`;
  const filePath = join(JDS_DIR, filename);
  await writeFile(filePath, renderJdMarkdown(job), 'utf8');
  return { filename, filePath };
}

function insertPendingLine(content, line) {
  const lines = content.split('\n');
  const pendingIndex = lines.findIndex(current => /^##\s+(Pendientes|Pending|Pendentes|En attente|Offen)\b/i.test(current));
  if (pendingIndex === -1) {
    return `${content.trimEnd()}\n\n## Pendientes\n\n${line}\n`;
  }

  let insertAt = pendingIndex + 1;
  while (insertAt < lines.length && lines[insertAt].trim() === '') {
    insertAt += 1;
  }
  while (insertAt < lines.length && !/^##\s+/.test(lines[insertAt])) {
    insertAt += 1;
  }

  lines.splice(insertAt, 0, line);
  return `${lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd()}\n`;
}

async function appendToPipeline(localRef, company, title, pipelineRaw) {
  const line = `- [ ] ${localRef} | ${company} | ${title}`;
  const next = insertPendingLine(pipelineRaw, line);
  await writeFile(PIPELINE_FILE, next, 'utf8');
}

function insertOnHoldLine(content, line) {
  const lines = content.split('\n');
  const sectionPattern = /^##\s+(On Hold|En Hold|En espera|On hold)\b/i;
  const sectionIndex = lines.findIndex(current => sectionPattern.test(current));
  if (sectionIndex === -1) {
    return `${content.trimEnd()}\n\n## On Hold — Manual Verify\n\n${line}\n`;
  }

  let insertAt = sectionIndex + 1;
  while (insertAt < lines.length && lines[insertAt].trim() === '') {
    insertAt += 1;
  }
  while (insertAt < lines.length && !/^##\s+/.test(lines[insertAt])) {
    insertAt += 1;
  }

  lines.splice(insertAt, 0, line);
  return `${lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd()}\n`;
}

async function appendOnHoldLead(url, company, title, pipelineRaw) {
  const line = `- [?] ${url} | ${company} | ${title}`;
  const next = insertOnHoldLine(pipelineRaw, line);
  await writeFile(PIPELINE_FILE, next, 'utf8');
}

async function appendScanHistory(job, status, queryName) {
  const date = new Date().toISOString().slice(0, 10);
  const row = `${job.canonicalUrl}\t${date}\t${queryName}\t${job.title}\t${job.company}\t${status}\n`;
  await appendFile(SCAN_HISTORY_FILE, row, 'utf8');
}

async function main() {
  const { flags, urls } = parseArgs(process.argv.slice(2));
  const loadedUrls = await loadUrls({ flags, urls });
  if (loadedUrls.length === 0) {
    usage();
  }

  const dedup = await loadDedupState();
  const normalized = loadedUrls.map(sourceUrl => {
    const jobId = extractIndeedJobId(sourceUrl);
    return {
      sourceUrl,
      jobId,
      canonicalUrl: jobId ? canonicalIndeedUrl(sourceUrl, jobId) : null,
    };
  });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const results = [];
  const seenCanonicalUrls = new Set();
  const seenCompanyRoles = new Set();

  for (const item of normalized) {
    if (!item.jobId || !item.canonicalUrl) {
      results.push({
        sourceUrl: item.sourceUrl,
        status: 'invalid',
        reason: 'could not extract Indeed jk/vjk',
      });
      continue;
    }

    if (dedup.scanUrls.has(item.canonicalUrl) || dedup.pipelineUrls.has(item.canonicalUrl)) {
      results.push({
        sourceUrl: item.sourceUrl,
        canonicalUrl: item.canonicalUrl,
        jobId: item.jobId,
        status: 'duplicate',
        reason: 'canonical URL already seen',
      });
      continue;
    }

    if (seenCanonicalUrls.has(item.canonicalUrl)) {
      results.push({
        sourceUrl: item.sourceUrl,
        canonicalUrl: item.canonicalUrl,
        jobId: item.jobId,
        status: 'duplicate',
        reason: 'canonical URL repeated in current run',
      });
      continue;
    }

    const extracted = await extractJob(page, item.canonicalUrl, item.sourceUrl);
    if (extracted.status !== 'resolved') {
      const fallbackTitle = normalizeText(extracted.title || flags.title || '');
      const fallbackCompany = normalizeText(extracted.company || flags.company || '');
      const fallbackKey = fallbackTitle && fallbackCompany ? `${normalizeKey(fallbackCompany)}::${normalizeKey(fallbackTitle)}` : '';
      if (
        flags.keepLead &&
        fallbackTitle &&
        fallbackCompany &&
        !seenCanonicalUrls.has(item.canonicalUrl) &&
        !dedup.scanUrls.has(item.canonicalUrl) &&
        !dedup.pipelineUrls.has(item.canonicalUrl) &&
        !seenCompanyRoles.has(fallbackKey) &&
        !dedup.pipelineCompanyRole.has(fallbackKey) &&
        !dedup.applicationsCompanyRole.has(fallbackKey)
      ) {
        await appendOnHoldLead(item.canonicalUrl, fallbackCompany, fallbackTitle, dedup.pipelineRaw);
        await appendScanHistory(
          {
            canonicalUrl: item.canonicalUrl,
            title: fallbackTitle,
            company: fallbackCompany,
          },
          'blocked_manual_verify',
          flags.queryName,
        );
        dedup.pipelineRaw = await readFile(PIPELINE_FILE, 'utf8');
        dedup.pipelineUrls.add(item.canonicalUrl);
        dedup.pipelineCompanyRole.add(fallbackKey);
        dedup.scanUrls.add(item.canonicalUrl);
        seenCanonicalUrls.add(item.canonicalUrl);
        seenCompanyRoles.add(fallbackKey);
        results.push({
          ...extracted,
          jobId: item.jobId,
          title: fallbackTitle,
          company: fallbackCompany,
          status: 'kept_lead',
          localRef: null,
        });
        continue;
      }
      results.push({
        ...extracted,
        jobId: item.jobId,
      });
      continue;
    }

    const companyRoleKey = `${normalizeKey(extracted.company)}::${normalizeKey(extracted.title)}`;
    if (seenCompanyRoles.has(companyRoleKey) || dedup.pipelineCompanyRole.has(companyRoleKey) || dedup.applicationsCompanyRole.has(companyRoleKey)) {
      results.push({
        ...extracted,
        jobId: item.jobId,
        status: 'duplicate',
        reason: 'company + role already tracked',
      });
      continue;
    }

    const job = { ...extracted, jobId: item.jobId };
    seenCanonicalUrls.add(job.canonicalUrl);
    seenCompanyRoles.add(companyRoleKey);
    const file = await writeJobFile(job);
    const localRef = `local:jds/${file.filename}`;

    if (flags.addToPipeline) {
      await appendToPipeline(localRef, job.company, job.title, dedup.pipelineRaw);
      await appendScanHistory(job, 'added', flags.queryName);
      dedup.pipelineRaw = await readFile(PIPELINE_FILE, 'utf8');
      dedup.pipelineUrls.add(job.canonicalUrl);
      dedup.pipelineCompanyRole.add(companyRoleKey);
      dedup.scanUrls.add(job.canonicalUrl);
    }

    results.push({
      ...job,
      file: file.filename,
      localRef,
      status: flags.addToPipeline ? 'added' : 'resolved',
    });
  }

  await browser.close();

  if (flags.json) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  for (const result of results) {
    if (result.status === 'added' || result.status === 'resolved' || result.status === 'kept_lead') {
      console.log(`✅ ${result.status.padEnd(8)} ${result.title} @ ${result.company}`);
      console.log(`   ${result.canonicalUrl}`);
      if (result.localRef) {
        console.log(`   ${result.localRef}`);
      }
      continue;
    }
    const url = result.canonicalUrl || result.sourceUrl;
    console.log(`⚠️  ${result.status.padEnd(8)} ${url}`);
    if (result.reason) {
      console.log(`   ${result.reason}`);
    }
  }
}

main().catch(error => {
  console.error(`Fatal: ${error.message}`);
  process.exit(1);
});

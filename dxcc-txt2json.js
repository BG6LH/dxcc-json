/**
 * DXCC Entity Data Parser
 * 
 * Features:
 * - Parse ARRL DXCC Current and Deleted Entities text file
 * - Generate standardized JSON format data
 * - Extract prefix, entity name, continent, ITU/CQ zone, entity code and other information
 * - Handle various special marks and notes
 * 
 * Author: BG6LH
 * Version: 0.1.0
 * Updated: 2025-06-05
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory path (ES module __dirname alternative)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Continent code mapping
 * Based on ARRL DXCC standard definition
 */
const CONTINENT_CODES = {
    'AF': 'Africa',
    'AN': 'Antarctica', 
    'AS': 'Asia',
    'EU': 'Europe',
    'NA': 'North America',
    'OC': 'Oceania',
    'SA': 'South America'
};

/**
 * Zone notes mapping
 * Specific zone ranges when ITU Zone is displayed as letters
 * Source: Prefix Cross References.md
 */
const ZONE_NOTES = {
    'A': '33, 42, 43, 44',
    'B': '67, 69-74',
    'C': '12, 13, 29, 30, 32, 38, 39',
    'D': '12, 13, 15',
    'E': '19, 20, 29, 30',
    'F': '20-26, 30-35, 75',
    'G': '16, 17, 18, 19, 23',
    'H': '2, 3, 4, 9, 75',
    'I': '55, 58, 59'
};

/**
 * Parse numbered notes section
 * 
 * @param {string[]} lines - All file lines
 * @param {number} startIndex - Start search line index
 * @param {boolean} isCurrentSection - Whether it's current entity section
 * @returns {Object} Object containing notes mapping
 */
function parseNumberedNotes(lines, startIndex, isCurrentSection) {
    const notes = {};
    const sectionName = isCurrentSection ? 'current' : 'deleted';
    const notePrefix = isCurrentSection ? 'current_note_' : 'deleted_note_';
    
    console.log(`Starting to parse numbered notes for ${sectionName} entities...`);
    
    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Stop parsing if encountering empty line or other section titles
        if (!line || line.includes('DELETED ENTITIES') || line.includes('ARRL DXCC LIST')) {
            break;
        }
        
        // Match numbered note format: number + space + content
        const noteMatch = line.match(/^(\d+)\s+(.+)$/);
        if (noteMatch) {
            const noteNumber = parseInt(noteMatch[1]);
            let noteText = noteMatch[2];
            
            // Handle multi-line notes
            let j = i + 1;
            while (j < lines.length) {
                const nextLine = lines[j].trim();
                
                // Stop if next line is empty, starts with number, or is section title
                if (!nextLine || /^\d+\s/.test(nextLine) || 
                    nextLine.includes('DELETED ENTITIES') || 
                    nextLine.includes('ARRL DXCC LIST')) {
                    break;
                }
                
                // Continue if line doesn't start with number (continuation line)
                if (!/^\d+/.test(nextLine)) {
                    noteText += ' ' + nextLine;
                    j++;
                } else {
                    break;
                }
            }
            
            const noteKey = `${notePrefix}${noteNumber}`;
            notes[noteKey] = noteText;
            console.log(`Found ${sectionName} note ${noteNumber}: ${noteText.substring(0, 50)}...`);
            
            // Update loop index
            i = j - 1;
        }
    }
    
    console.log(`Parsed ${Object.keys(notes).length} ${sectionName} numbered notes`);
    return notes;
}

/**
 * Parse symbol notes
 * Extract symbol notes from file beginning
 * 
 * @param {string[]} lines - All file lines
 * @param {number} startIndex - Start search line index

 * @returns {Object} Symbol notes object
r */
function parseSymbolNotes(lines, startIndex = 0) {
    console.log('Starting to parse symbol notes...');
    const symbolNotes = {};
    
    // 遍历整个文件来查找符号备注，不限制在开头部分
    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // 跳过空行
        if (!line) continue;
        
        // Match QSL service mark (*)
        if (line.includes('QSL') && line.includes('Service') && line.includes('*')) {
            symbolNotes.qsl_service = line;
            console.log('Found QSL service note');
        }
        
        // Match third-party traffic mark (#)
        if (line.includes('third-party') && line.includes('traffic') && line.includes('#') && !line.startsWith('^')) {
            symbolNotes.third_party_traffic = line;
            console.log('Found third-party traffic note');
        }
        
        // Match Antarctica special note (^) - starts with ^ symbol
        if (line.startsWith('^')) {
            console.log(`Found Antarctica note line at line ${i + 1}: "${line}"`);
            // 移除开头的 ^ 符号并清理文本
            let antarcticaNote = line.substring(1).trim();
            
            // Check for continuation lines
            let j = i + 1;
            while (j < lines.length) {
                const nextLine = lines[j].trim();
                
                // 停止条件：遇到空行、新的符号备注、数字备注或特定分隔符
                if (!nextLine || 
                    nextLine.startsWith('*') || 
                    nextLine.startsWith('#') || 
                    nextLine.startsWith('^') || 
                    /^\d+\s/.test(nextLine) ||
                    nextLine.includes('Zone Notes')) {
                    break;
                }
                
                antarcticaNote += ' ' + nextLine;
                console.log(`Adding continuation line: "${nextLine}"`);
                j++;
            }
            
            symbolNotes.antarctica_special = antarcticaNote;
            console.log(`Antarctica special note found: ${antarcticaNote}`);
            i = j - 1;
        }
    }
    
    console.log('Symbol notes parsed:', Object.keys(symbolNotes));
    return symbolNotes;
}

/**
 * Parse Zone notes
 * Extract zone letter mappings
 * 
 * @param {string[]} lines - All file lines
 * @returns {Object} zone notes object
 */
function parseZone(lines) {
    console.log('Parsing Zone notes...');
    return ZONE_NOTES;
}

/**
 * Extract prefix notes
 * Extract note references from entity prefix
 * 
 * @param {string} prefix - Entity prefix
 * @param {boolean} isCurrent - Whether it's current entity
 * @returns {Array} Note reference array
 */
function extractPrefixNotes(prefix, isCurrent) {
    const notes = [];
    
    // Extract numbered notes
    const numberMatches = prefix.match(/\((\d+)\)/g);
    if (numberMatches) {
        numberMatches.forEach(match => {
            const number = match.replace(/[()]/g, '');
            notes.push(isCurrent ? `current_note_${number}` : `deleted_note_${number}`);
        });
    }
    
    // Check for special symbols
    if (prefix.includes('*')) {
        notes.push('qsl_service');
    }
    if (prefix.includes('#')) {
        notes.push('third_party_traffic');
    }
    if (prefix.includes('^')) {
        notes.push('antarctica_special');
    }
    
    return notes;
}

/**
 * Create DXCC data
 * Main function to parse DXCC file and generate JSON data
 * 
 * @param {string} filePath - Input file path
 * @param {string} filterType - Filter type: 'all', 'current', 'deleted'
 * @returns {Object} Parsed DXCC data object
 */
function createDXCCData(filePath, filterType = 'all') {
    console.log(`Starting to parse DXCC file: ${filePath}`);
    console.log(`Filter type: ${filterType}`);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
        console.error(`❌ Error: Input file does not exist: ${filePath}`);
        console.error(`💡 Please check the file path and ensure the file exists.`);
        console.error(`💡 Available files in the directory might include:`);
        
        // Try to list files in the same directory for suggestions
        try {
            const dir = path.dirname(filePath);
            const files = fs.readdirSync(dir)
                .filter(file => file.endsWith('.txt') && file.toLowerCase().includes('current'))
                .slice(0, 5); // Show up to 5 suggestions
            
            if (files.length > 0) {
                files.forEach(file => {
                    console.error(`   - ${path.join(dir, file)}`);
                });
            } else {
                console.error(`   (No .txt files found in ${dir})`);
            }
        } catch (dirError) {
            console.error(`   (Unable to list directory contents)`);
        }
        
        throw new Error(`Input file not found: ${filePath}`);
    }
    
    // Read file
    let content;
    try {
        content = fs.readFileSync(filePath, 'utf-8');
    } catch (readError) {
        console.error(`❌ Error reading file: ${filePath}`);
        console.error(`💡 Error details: ${readError.message}`);
        throw new Error(`Failed to read file: ${filePath}`);
    }
    
    const lines = content.split('\n');
    
    console.log(`File read complete, total ${lines.length} lines`);
    
    // Extract edition information from file content
    let edition = "Unknown Edition";
    for (let i = 0; i < Math.min(10, lines.length); i++) {
        const line = lines[i].trim();
        // Match patterns like "February 2022", "January 2013 Edition", etc.
        const editionMatch = line.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})(?:\s+Edition)?/i);
        if (editionMatch) {
            edition = editionMatch[0];
            console.log(`Found edition: ${edition}`);
            break;
        }
    }
    
    // Parse symbol notes from the beginning using the dedicated function
    const symbolNotes = parseSymbolNotes(lines, 0);
    console.log('Symbol notes parsed:', Object.keys(symbolNotes));
    
    // Find entity data start (after the header table)
    let dataStartIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.includes('___________')) { // Table separator line
            dataStartIndex = i + 1;
            break;
        }
    }
    
    console.log(`Found entity data start at line ${dataStartIndex}`);
    
    // Parse entities and find notes sections
    const entities = [];
    let currentEntitiesCount = 0;
    let deletedEntitiesCount = 0;
    let inDeletedSection = false;
    let currentNotesStart = -1;
    let deletedNotesStart = -1;
    
    for (let i = dataStartIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip empty lines
        if (!line) continue;
        
        // Check for NOTES section (current entities notes)
        if (line === 'NOTES:' && !inDeletedSection) {
            currentNotesStart = i + 1;
            console.log(`Found current entities NOTES at line ${i}`);
            continue;
        }
        
        // Check if entering deleted entities section
        if (line.includes('DELETED ENTITIES')) {
            inDeletedSection = true;
            console.log('Entering deleted entities section');
            continue;
        }
        
        // Check for deleted entities notes
        if (line === 'NOTES:' && inDeletedSection) {
            deletedNotesStart = i + 1;
            console.log(`Found deleted entities NOTES at line ${i}`);
            break; // Stop parsing entities, start parsing deleted notes
        }
        
        // Skip headers and separators - 更完整的跳过条件
        if (line.includes('Prefix') || 
            line.includes('Entity') || 
            line.includes('Continent') || 
            line.includes('_____') || 
            // Remove hardcoded version check
            // line.includes('February 2022') ||
            line.includes('Deleted Entities Total') ||
            line.includes('Current Entities Total') ||
            line.includes('Credit for any') ||
            line.includes('Effective April') ||
            line.includes('ZONE') ||
            line.includes('ITU Zone') ||
            line.includes('Code') ||
            line.includes('ARRL DXCC LIST') ||
            line.includes('Zone Notes can be found') ||
            line.includes('Prefix Cross References') ||
            line.includes('QSL via country') ||
            line.includes('third-party traffic') ||
            // Add dynamic edition pattern check
            /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}(?:\s+Edition)?$/i.test(line) ||
            line.startsWith('*') ||
            line.startsWith('#') ||
            line.startsWith('^')) {
            continue;
        }
        
        // Skip numbered notes lines
        if (/^\d+\s/.test(line)) {
            continue;
        }
        
        // Parse entity line - 进一步优化正则表达式处理复杂格式
        // Parse entity line - 使用更灵活的匹配策略
        // 先尝试标准格式匹配 - 修复前缀解析问题
        // 修复正则表达式匹配，确保正确分离 ITU Zone 和 CQ Zone
        let entityMatch = line.match(/^\s*([A-Z0-9\/,\-\*\^\_\#\(\)]+)\s+([A-Za-z0-9\s\&\.\-\'\(\),\/]+?)\s+((?:AF|AN|AS|EU|NA|OC|SA)(?:,(?:AF|AN|AS|EU|NA|OC|SA))*)\s+(\d+)\s+(\d+)\s+(\d+)\s*$/);
        
        // 如果标准格式不匹配，尝试更宽松的格式
        if (!entityMatch) {
        // 使用制表符或多个空格分隔的格式，确保 ITU 和 CQ Zone 分别匹配
        entityMatch = line.match(/^\s*([A-Z0-9\/,\-\*\^\_\#\(\)\s]+?)\s+(\S.*?)\s+((?:AF|AN|AS|EU|NA|OC|SA)(?:,(?:AF|AN|AS|EU|NA|OC|SA))*)\s+(\d+)\s+(\d+)\s+(\d+)\s*$/);
        }
        
        // 在第 380-420 行的解析部分，需要修复字段分割逻辑
        
        // 如果还是不匹配，尝试按空格分割的方法
        if (!entityMatch) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 6) {
        // 检查最后一个是否为数字（实体代码）
        const lastPart = parts[parts.length - 1];
        if (/^\d+$/.test(lastPart)) {
        // 检查倒数第四个是否为大洲代码
        const continentPart = parts[parts.length - 4];
        if (/^(AF|AN|AS|EU|NA|OC|SA)(,(AF|AN|AS|EU|NA|OC|SA))*$/.test(continentPart)) {
        // 重构匹配结果 - 修复 ITU Zone 和 CQ Zone 的分配
        const prefix = parts[0];
        const entity = parts.slice(1, parts.length - 4).join(' ');
        const continent = continentPart;
        // 修复：ITU Zone 是倒数第三个，CQ Zone 是倒数第二个
        const zoneITU = parts[parts.length - 3];
        const zoneCQ = parts[parts.length - 2];
        const entityCode = lastPart;
        
        entityMatch = [line, prefix, entity, continent, zoneITU, zoneCQ, entityCode];
        }
        }
        }
        }
        
        if (entityMatch) {
            const [, prefix, entity, continent, zoneITU, zoneCQ, entityCode] = entityMatch;
            
            // Extract notes
            const notes = extractPrefixNotes(prefix.trim(), !inDeletedSection);
            
            const entityObj = {
                prefix: prefix.trim().replace(/[\*\^\#]/g, '').replace(/\([^)]*\)/g, ''), // 移除特殊字符和括号标注
                entity: entity.trim(),
                continent: continent.trim(),
                zoneITU: zoneITU.trim(),
                zoneCQ: zoneCQ.trim(),
                entityCode: parseInt(entityCode),
                notes: notes,
                isCurrent: !inDeletedSection
            };
            
            entities.push(entityObj);
            
            // 添加调试输出，显示成功解析的实体DXCC编号
            console.log(`✓ Found entity #${entityCode}: ${entity.trim()} (${inDeletedSection ? 'Deleted' : 'Current'})`);
            
            if (inDeletedSection) {
                deletedEntitiesCount++;
            } else {
                currentEntitiesCount++;
            }
        } else {
            // Debug: log unmatched lines that look like entity data
            // 改进过滤条件，排除明显的说明文字
            if (line.length > 20 && 
                !line.includes('NOTES') && 
                !line.includes('Total') && 
                !line.includes('auspices') &&
                !line.includes('can check') &&
                !line.includes('October') &&
                !/^\d+\s/.test(line) && 
                !line.startsWith('*') && 
                !line.startsWith('#') && 
                !line.startsWith('^') &&
                !line.includes('http://') &&
                !line.includes('visit:')) {
                console.log(`Unmatched entity line: \"${line}\"`);
            }
        }
    }
    
    console.log(`Entity parsing complete:`);
    console.log(`- Current entities: ${currentEntitiesCount}`);
    console.log(`- Deleted entities: ${deletedEntitiesCount}`);
    console.log(`- Total entities: ${entities.length}`);
    
    // Parse current notes
    const currentNotes = {};
    if (currentNotesStart > 0) {
        for (let i = currentNotesStart; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Stop at deleted entities section
            if (line.includes('DELETED ENTITIES')) break;
            
            const noteMatch = line.match(/^(\d+)\s+(.+)$/);
            if (noteMatch) {
                const noteNumber = parseInt(noteMatch[1]);
                let noteText = noteMatch[2];
                
                // Handle multi-line notes
                let j = i + 1;
                while (j < lines.length) {
                    const nextLine = lines[j].trim();
                    if (!nextLine || /^\d+\s/.test(nextLine) || nextLine.includes('DELETED ENTITIES')) {
                        break;
                    }
                    if (!/^\d+/.test(nextLine)) {
                        noteText += ' ' + nextLine;
                        j++;
                    } else {
                        break;
                    }
                }
                
                currentNotes[`current_note_${noteNumber}`] = noteText;
                console.log(`Found current note ${noteNumber}: ${noteText.substring(0, 50)}...`);
                i = j - 1;
            }
        }
    }
    
    // Parse deleted notes
    const deletedNotes = {};
    if (deletedNotesStart > 0) {
        for (let i = deletedNotesStart; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (!line) continue;
            
            const noteMatch = line.match(/^(\d+)\s+(.+)$/);
            if (noteMatch) {
                const noteNumber = parseInt(noteMatch[1]);
                let noteText = noteMatch[2];
                
                // Handle multi-line notes
                let j = i + 1;
                while (j < lines.length) {
                    const nextLine = lines[j].trim();
                    if (!nextLine || /^\d+\s/.test(nextLine)) {
                        break;
                    }
                    if (!/^\d+/.test(nextLine)) {
                        noteText += ' ' + nextLine;
                        j++;
                    } else {
                        break;
                    }
                }
                
                deletedNotes[`deleted_note_${noteNumber}`] = noteText;
                console.log(`Found deleted note ${noteNumber}: ${noteText.substring(0, 50)}...`);
                i = j - 1;
            }
        }
    }
    
    console.log(`Notes parsing complete:`);
    console.log(`- Current notes: ${Object.keys(currentNotes).length}`);
    console.log(`- Deleted notes: ${Object.keys(deletedNotes).length}`);
    
    // Parse zone notes
    const zoneNotes = parseZone(lines);
    
    // Count entities by continent
    const continentStats = {};
    entities.filter(e => e.isCurrent).forEach(entity => {
        continentStats[entity.continent] = (continentStats[entity.continent] || 0) + 1;
    });
    
    // Build final data structure
    // Apply filtering based on filterType
    let filteredEntities = entities;
    let filteredDescription = "Current and Deleted DXCC Entities";
    
    if (filterType === 'current') {
        filteredEntities = entities.filter(entity => entity.isCurrent === true);
        filteredDescription = "Current DXCC Entities";
        console.log(`Filtered to current entities only: ${filteredEntities.length} entities`);
    } else if (filterType === 'deleted') {
        filteredEntities = entities.filter(entity => entity.isCurrent === false);
        filteredDescription = "Deleted DXCC Entities";
        console.log(`Filtered to deleted entities only: ${filteredEntities.length} entities`);
    }
    
    // Recalculate statistics for filtered data
    const filteredCurrentCount = filteredEntities.filter(e => e.isCurrent === true).length;
    const filteredDeletedCount = filteredEntities.filter(e => e.isCurrent === false).length;
    
    const dxccData = {
        metadata: {
            title: "ARRL DXCC List",
            edition: edition,
            totalEntities: filteredEntities.length,
            honorRollThreshold: 331,
            description: filteredDescription,
            filterType: filterType,
            notes: {
                ...symbolNotes,
                ...(filterType !== 'deleted' ? currentNotes : {}),
                ...(filterType !== 'current' ? deletedNotes : {})
            },
            continents: CONTINENT_CODES,
            zoneNotes: zoneNotes,
            generatedAt: new Date().toISOString(),
            sourceFile: path.basename(filePath),
            version: "1.1.0",
            author: "BG6LH",
            statistics: {
                totalParsed: filteredEntities.length,
                currentEntities: filteredCurrentCount,
                deletedEntities: filteredDeletedCount,
                continents: continentStats,
                notesStatistics: {
                    currentNotesCount: filterType !== 'deleted' ? Object.keys(currentNotes).length : 0,
                    deletedNotesCount: filterType !== 'current' ? Object.keys(deletedNotes).length : 0,
                    zoneNotesCount: Object.keys(zoneNotes).length
                }
            }
        },
        entities: filteredEntities
    };
    
    return dxccData;
}

/**
 * Parse command line arguments
 * @returns {Object} Parsed arguments
 */
function parseArguments() {
    const args = process.argv.slice(2);
    let inputFile = null;
    let outputFile = null;
    let filterType = 'all';
    
    // Show help if no arguments provided
    if (args.length === 0) {
        showHelp();
        process.exit(0);
    }
    
    // Parse arguments - options first, then files
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        if (arg === '--all') {
            filterType = 'all';
        } else if (arg === '--current') {
            filterType = 'current';
        } else if (arg === '--deleted') {
            filterType = 'deleted';
        } else if (arg === '--help' || arg === '-h') {
            showHelp();
            process.exit(0);
        } else if (arg.startsWith('--')) {
            // Check for unknown option parameters
            console.error(`❌ Error: Unknown option '${arg}'`);
            console.error(`💡 Supported options: --all, --current, --deleted, --help`);
            process.exit(1);
        } else {
            // This is a file argument
            if (!inputFile) {
                // Validate input file format
                if (!arg.endsWith('.txt')) {
                    console.error(`❌ Error: Input file must be in .txt format, current input: '${arg}'`);
                    console.error(`💡 Example: 2022_Current_Deleted.txt`);
                    process.exit(1);
                }
                
                // Validate input file existence
                if (!fs.existsSync(arg)) {
                    console.error(`❌ Error: Input file does not exist: '${arg}'`);
                    
                    // Provide file suggestions
                    const dir = path.dirname(arg) || '.';
                    try {
                        const files = fs.readdirSync(dir)
                            .filter(file => file.endsWith('.txt') && 
                                   (file.toLowerCase().includes('current') || 
                                    file.toLowerCase().includes('deleted') ||
                                    file.toLowerCase().includes('dxcc')))
                            .slice(0, 5);
                        
                        if (files.length > 0) {
                            console.error(`💡 Possible files in directory:`);
                            files.forEach(file => {
                                console.error(`   - ${file}`);
                            });
                        }
                    } catch (e) {
                        // Ignore directory read errors
                    }
                    
                    process.exit(1);
                }
                
                inputFile = arg;
            } else if (!outputFile) {
                // Validate output file format and ensure it's just a filename
                if (!arg.endsWith('.json')) {
                    console.error(`❌ Error: Output file must be in .json format, current input: '${arg}'`);
                    console.error(`💡 Example: dxcc_entities.json`);
                    process.exit(1);
                }
                
                // Extract just the filename (ignore any path)
                const filename = path.basename(arg);
                // Always place output file in script directory
                outputFile = path.join(__dirname, filename);
            } else {
                // Too many file arguments
                console.error(`❌ Error: Too many arguments, unrecognized parameter: '${arg}'`);
                console.error(`💡 Use --help to see correct usage`);
                process.exit(1);
            }
        }
    }
    
    // Set default input file if not provided
    if (!inputFile) {
        const defaultFile = path.join(__dirname, '2022_Current_Deleted.txt');
        if (!fs.existsSync(defaultFile)) {
            console.error(`❌ Error: Default input file does not exist: ${defaultFile}`);
            console.error(`💡 Please specify a valid input file`);
            process.exit(1);
        }
        inputFile = defaultFile;
    }
    
    return { inputFile, outputFile, filterType };
}

/**
 * Generate output filename based on input file and filter type
 * @param {string} inputFile - Input file path
 * @param {string} filterType - Filter type
 * @param {string} edition - Edition string
 * @returns {string} Generated output filename
 */
function generateOutputFilename(inputFile, filterType, edition) {
    // Always use script directory for output files
    const scriptDir = __dirname;
    
    // Extract year from edition (e.g., "February 2022" -> "2022")
    const yearMatch = edition.match(/(\d{4})/);
    const year = yearMatch ? yearMatch[1] : 'unknown';
    
    // Validate year reasonableness
    if (year === 'unknown' || parseInt(year) < 1900 || parseInt(year) > new Date().getFullYear() + 10) {
        console.warn(`⚠️  Warning: Year extracted from edition info may be incorrect: ${year}`);
    }
    
    let filename;
    switch (filterType) {
        case 'current':
            filename = `dxcc_current_${year}.json`;
            break;
        case 'deleted':
            filename = `dxcc_deleted_${year}.json`;
            break;
        default:
            filename = `dxcc_current_deleted_${year}.json`;
    }
    
    const outputPath = path.join(scriptDir, filename);
    
    // Check if output file already exists
    if (fs.existsSync(outputPath)) {
        console.warn(`⚠️  Warning: Output file already exists and will be overwritten: ${outputPath}`);
    }
    
    return outputPath;
}

/**
 * Show help information
 */
function showHelp() {
    console.log('DXCC Entity Data Parser v1.1.0');
    console.log('Author: BG6LH');
    console.log('');
    console.log('Usage:');
    console.log('  node dxcc-txt2json.js [options] [input_file] [output_file]');
    console.log('');
    console.log('Options:');
    console.log('  --all      Output all entities (current and deleted) [default]');
    console.log('  --current  Output only current entities');
    console.log('  --deleted  Output only deleted entities');
    console.log('  --help, -h Show this help message');
    console.log('');
    console.log('Examples:');
    console.log('  # Output all entities (default)');
    console.log('  node dxcc-txt2json.js 2022_Current_Deleted.txt');
    console.log('  node dxcc-txt2json.js --all 2022_Current_Deleted.txt');
    console.log('');
    console.log('  # Output only current entities');
    console.log('  node dxcc-txt2json.js --current 2022_Current_Deleted.txt');
    console.log('');
    console.log('  # Output only deleted entities');
    console.log('  node dxcc-txt2json.js --deleted 2022_Current_Deleted.txt');
    console.log('');
    console.log('  # Specify custom output filename (will be saved in script directory)');
    console.log('  node dxcc-txt2json.js --current 2022_Current_Deleted.txt my_output.json');
    console.log('');
    console.log('  # Process files from subdirectory');
    console.log('  node dxcc-txt2json.js --all txt/2013_Current_Deleted.txt');
    console.log('');
    console.log('Arguments:');
    console.log('  input_file   Path to the DXCC text file (.txt format)');
    console.log('  output_file  Output JSON filename (.json format) [optional]');
    console.log('');
    console.log('Notes:');
    console.log('  - Options must be specified before file arguments');
    console.log('  - All output files are saved in the script directory');
    console.log('  - If output file is not specified, it will be auto-generated');
    console.log('  - Input file can be in any directory, but must exist');
    console.log('  - Output filename should not include path (path will be ignored)');
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
    try {
        const { inputFile, outputFile, filterType } = parseArguments();
        
        console.log('='.repeat(60));
        console.log('DXCC Entity Data Parser v1.1.0');
        console.log('Author: BG6LH');
        console.log('='.repeat(60));
        
        const dxccData = createDXCCData(inputFile, filterType);
        
        // Generate output filename if not specified
        const finalOutputFile = outputFile || generateOutputFilename(inputFile, filterType, dxccData.metadata.edition);
        
        // Write JSON file
        fs.writeFileSync(finalOutputFile, JSON.stringify(dxccData, null, 2), 'utf-8');
        
        console.log('\n' + '='.repeat(60));
        console.log('✅ DXCC data generation completed!');
        console.log(`📁 Input file: ${inputFile}`);
        console.log(`📄 Output file: ${finalOutputFile}`);
        console.log(`🔍 Filter type: ${filterType}`);
        console.log(`📊 Statistics:`);
        console.log(`   - Total entities: ${dxccData.entities.length}`);
        console.log(`   - Current entities: ${dxccData.metadata.statistics.currentEntities}`);
        console.log(`   - Deleted entities: ${dxccData.metadata.statistics.deletedEntities}`);
        console.log(`   - Current notes: ${dxccData.metadata.statistics.notesStatistics.currentNotesCount}`);
        console.log(`   - Deleted notes: ${dxccData.metadata.statistics.notesStatistics.deletedNotesCount}`);
        console.log(`   - File size: ${(fs.statSync(finalOutputFile).size / 1024).toFixed(1)} KB`);
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('\n' + '='.repeat(60));
        console.error('❌ DXCC data generation failed!');
        console.error(`🔍 Error: ${error.message}`);
        console.error('='.repeat(60));
        
        // Provide usage help
        console.error('\n📖 Usage:');
        console.error('  node dxcc-txt2json.js [input_file] [output_file] [options]');
        console.error('\n📝 Examples:');
        console.error('  node dxcc-txt2json.js 2022_Current_Deleted.txt --current');
        console.error('  node dxcc-txt2json.js "2020 Current_Deleted.txt" --deleted');
        console.error('  node dxcc-txt2json.js 2013_Current_Deleted.txt my_output.json --all');
        console.error('\n💡 Use --help for more information');
        
        process.exit(1);
    }
}

export { createDXCCData };
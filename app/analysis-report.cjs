const {createRequire}=require('node:module');
const r=createRequire(require('node:path').join(process.env.CODEX_PACKAGES||'C:/Users/PSH-Nadeem/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules','_entry.cjs'));
const {Document,Packer,Paragraph,TextRun,HeadingLevel,AlignmentType,Table,TableRow,TableCell,WidthType,ShadingType,PageOrientation}=r('docx');

module.exports=async function analysisReport(data){
 const font='David',blue='173F5F',teal='147D7A',border={style:'single',size:1,color:'C8D8E0'},hebrewLanguage={value:'he-IL',eastAsia:'he-IL',bidirectional:'he-IL'};
 const rtlParagraph={bidirectional:true,alignment:AlignmentType.RIGHT};
 const p=(text,{heading, bold=false, size=24, color='263B4B'}={})=>new Paragraph({...rtlParagraph,heading,spacing:{after:120,line:360},children:[new TextRun({text:String(text??'—'),rightToLeft:true,font,language:hebrewLanguage,size,bold,color})]});
 const table=(headers,rows)=>new Table({width:{size:100,type:WidthType.PERCENTAGE},visuallyRightToLeft:true,rows:[headers,...rows].map((row,i)=>new TableRow({tableHeader:i===0,children:row.map(value=>new TableCell({shading:i===0?{fill:blue,type:ShadingType.CLEAR}:undefined,borders:{top:border,bottom:border,left:border,right:border},children:[new Paragraph({...rtlParagraph,spacing:{after:40,line:300},children:[new TextRun({text:String(value??'—'),rightToLeft:true,font,language:hebrewLanguage,size:i===0?22:20,bold:i===0,color:i===0?'FFFFFF':'263B4B'})]})]}))}))});
 const f=x=>Number.isFinite(Number(x))?Number(x).toFixed(2):'—',children=[p('דוח ניתוח נתונים',{heading:HeadingLevel.TITLE,size:28,bold:true,color:blue}),p(`מחקר: ${data.paperTitle||'לא משויך'}`,{bold:true}),p(`קובץ: ${data.fileName||'לא ידוע'} · ${data.rowCount||0} שורות · ${data.columnCount||0} משתנים`),p(`תאריך הפקה: ${data.createdAt||''}`),p('הדוח מסכם חישובים שבוצעו לפי בחירות החוקר. יש לאמת התאמת פריטים, קידוד והנחות לפני שילוב התוצאות במאמר. תוצאות תיאוריות אינן מוכיחות סיבתיות.',{color:teal})];
 children.push(p('סיכום המדדים',{heading:HeadingLevel.HEADING_1,bold:true,size:28,color:teal}));
 children.push(table(['מדד','N תקף','חסרים','ממוצע','חציון','סטיית תקן','שונות מדגמית','מינימום','מקסימום','טווח'],(data.measures||[]).map(x=>[x.name,x.valid,x.missing,f(x.mean),f(x.median),f(x.sd),f(x.variance),f(x.min),f(x.max),f(x.range)])));
 for(const measure of data.measures||[]){
  children.push(p(measure.name,{heading:HeadingLevel.HEADING_2,bold:true,size:28,color:blue}));
  children.push(p(`כלל ציון: ${measure.rule||'לא צוין'} · טיפול בחסרים: ${measure.missingRule||'לא צוין'} · פריטים: ${(measure.items||[]).join(', ')||'לא צוין'}${measure.reverse?.length?` · פריטים הפוכים: ${measure.reverse.join(', ')}`:''}`));
  if(measure.itemsTable?.length)children.push(table(['#','משתנה','N תקף','חסרים','ממוצע','סטיית תקן','שונות','חציון','שכיח','מינימום','מקסימום','טווח'],measure.itemsTable.map((x,i)=>[i+1,x.name,x.n,x.missing,f(x.mean),f(x.sd),f(x.variance),f(x.median),f(x.mode),f(x.min),f(x.max),f(x.range)])));
  children.push(p('טיוטה תיאורית לשילוב במאמר',{heading:HeadingLevel.HEADING_3,bold:true,size:28,color:teal}));
  children.push(p(measure.paragraph||'לא נוצרה טיוטה תיאורית.'));
 }
 if(data.group?.rows?.length){children.push(p('תיאור לפי קבוצות',{heading:HeadingLevel.HEADING_1,bold:true,size:30,color:teal}));children.push(p(`קבוצות לפי ${data.group.groupName}; המשתנה לתיאור: ${data.group.variableName}`));children.push(table(['קבוצה','N','ממוצע','סטיית תקן'],[...data.group.rows.map(x=>[x.name,x.n,f(x.mean),f(x.sd)]),['סך הכול',data.group.total?.n,f(data.group.total?.mean),f(data.group.total?.sd)]]))}
 if(data.correlation){children.push(p('מתאם Spearman',{heading:HeadingLevel.HEADING_1,bold:true,size:30,color:teal}));children.push(table(['משתנה 1','משתנה 2','N זוגות','ρ','p'],[[data.correlation.xName,data.correlation.yName,data.correlation.n,f(data.correlation.rho),data.correlation.p<.001?'< .001':f(data.correlation.p)]]));children.push(p(data.correlation.pMethod||'יש לפרש את המתאם לפי תכנון המחקר והנחות הניתוח.'))}
 const inferentialResults=(data.inferentialResults||((data.inferentialResult&&!data.inferentialResult.error)?[data.inferentialResult]:[])).filter(x=>x&&!x.error);
 if(inferentialResults.length){children.push(p('מבחנים ומתאמים שנבחרו וחושבו',{heading:HeadingLevel.HEADING_1,bold:true,size:28,color:teal}));for(const result of inferentialResults){children.push(p(result.title||'מבחן סטטיסטי',{heading:HeadingLevel.HEADING_2,bold:true,size:28,color:blue}));if(result.variables){const v=result.variables;children.push(p(v.group?`משתנה קבוצה: ${v.group} · משתני תוצאה: ${(v.outcomes||[]).join(', ')}`:`משתנים: ${[v.x,v.y].filter(Boolean).join(' · ')}`))}if(result.stats?.length)children.push(table(['מדד','תוצאה'],result.stats));for(const outcome of result.outcomes||[]){children.push(p(`משתנה תוצאה: ${outcome.name}`,{bold:true}));if(outcome.error){children.push(p(`לא חושב: ${outcome.error}`,{color:'A33A36'}));continue}if(outcome.stats?.length)children.push(table(['מדד','תוצאה'],outcome.stats));if(outcome.groups?.length)children.push(table(['קבוצה','N','ממוצע','סטיית תקן'],outcome.groups.map(g=>[g.name,g.n,f(g.mean),f(g.sd)])))}children.push(p(result.note||'יש לבדוק התאמת סולם, תכנון מדגם והנחות לפני דיווח.'))}}
 const reliabilityResults=(data.reliabilityResults||[]).filter(x=>x&&!x.error);
 if(reliabilityResults.length){children.push(p('מהימנות פנימית — אלפא קרונבאך',{heading:HeadingLevel.HEADING_1,bold:true,size:28,color:teal}));for(const result of reliabilityResults){children.push(p(result.name,{heading:HeadingLevel.HEADING_2,bold:true,size:28,color:blue}));children.push(table(['אלפא','מספר היגדים','N מלא'],[[f(result.alpha),result.itemCount,result.validN]]));if(result.interpretation)children.push(p(result.interpretation));if(result.items?.length)children.push(table(['היגד','מתאם פריט–סך מתוקן','אלפא אם הוסר','שינוי באלפא','בדיקה'],result.items.map(x=>[x.name,f(x.correctedItemTotal),f(x.alphaIfDeleted),f(x.alphaChange),x.review?'כדאי לבדוק':'—'])));children.push(p(result.note||'אלפא היא כלי להערכת עקביות פנימית ואינה מוכיחה חד־ממדיות או תוקף.'))}}
 if(data.comparisons?.length){children.push(p('השוואה בין מדדים על אותם נבדקים',{heading:HeadingLevel.HEADING_1,bold:true,size:28,color:teal}));children.push(table(['צמד מדדים','N מזווג','הפרש ממוצעים','t מזווג','p','Pearson r','p'],data.comparisons.map(x=>[x.pair,x.n,f(x.meanDifference),x.t,fP(x.tP),f(x.r),fP(x.rP)])));children.push(p('יש לבדוק את הנחות מבחן t על ציוני ההפרש ואת הנחות Pearson, לרבות קשר לינארי וחריגים.'))}
 const doc=new Document({
  styles:{default:{document:{run:{font,size:24,rightToLeft:true,language:hebrewLanguage},paragraph:{...rtlParagraph,spacing:{line:360}}}},paragraphStyles:[
   {id:'Title',name:'Title',basedOn:'Normal',paragraph:rtlParagraph,run:{font,size:28,bold:true,color:blue,rightToLeft:true,language:hebrewLanguage}},
   {id:'Heading1',name:'Heading 1',basedOn:'Normal',paragraph:rtlParagraph,run:{font,size:28,bold:true,color:teal,rightToLeft:true,language:hebrewLanguage}},
   {id:'Heading2',name:'Heading 2',basedOn:'Normal',paragraph:rtlParagraph,run:{font,size:28,bold:true,color:blue,rightToLeft:true,language:hebrewLanguage}},
   {id:'Heading3',name:'Heading 3',basedOn:'Normal',paragraph:rtlParagraph,run:{font,size:28,bold:true,color:teal,rightToLeft:true,language:hebrewLanguage}}
  ]},
  sections:[{properties:{page:{orientation:PageOrientation.LANDSCAPE,margin:{top:1134,bottom:1134,left:1134,right:1134}},},children}]
 });
 const buffer=await Packer.toBuffer(doc);
 const JSZipLibrary=typeof JSZip!=='undefined'?JSZip:require(require.resolve('jszip',{paths:[process.env.CODEX_PACKAGES||'C:/Users/PSH-Nadeem/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules']}));
 const zip=await JSZipLibrary.loadAsync(buffer);let xml=await zip.file('word/document.xml').async('string');
 xml=xml.replace(/<w:sectPr([^>]*)>([\s\S]*?)<\/w:sectPr>/g,(full,attrs,body)=>{if(/<w:bidi\b/.test(body))return full;const bidi='<w:bidi/>';const anchor=body.search(/<w:(?:rtlGutter|docGrid|printerSettings)\b/);return `<w:sectPr${attrs}>${anchor>=0?body.slice(0,anchor)+bidi+body.slice(anchor):body+bidi}</w:sectPr>`});
 if(!/<w:bidi\b/.test(xml)||!/<w:rtl\b/.test(xml)||!/<w:bidiVisual\b/.test(xml))throw new Error('Word report is missing required right-to-left paragraph, text, or table settings.');
 zip.file('word/document.xml',xml);
 return zip.generateAsync({type:'nodebuffer'});
};
function fP(x){return Number.isFinite(Number(x))?(Number(x)<.001?'< .001':Number(x).toFixed(3)):'—'}

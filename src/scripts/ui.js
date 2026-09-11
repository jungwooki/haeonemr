/* ===================== 3. UI 빌더 ===================== */
const UI = {
  group:(c)=>`<div class="bg-white rounded-[10px] overflow-hidden border border-[#EDEEF1] w-full">${c}</div>`,
  inputRow:(label,field,placeholder,type="text",suffix="")=>`
    <div class="flex items-center justify-between p-3 px-4 border-b border-[#EDEEF1] last:border-0 bg-white">
      <span class="text-[16px] font-semibold text-black">${label}</span>
      <div class="flex items-center gap-1">
        <input type="${type}" oninput="updateData('${field}', this.value)" value="${formData[field]}" class="text-right text-[16px] text-[#8E8E93] font-medium outline-none w-40 placeholder:text-gray-300 bg-transparent" placeholder="${placeholder}">
        ${suffix?`<span class="text-[#8E8E93] font-medium text-[15px]">${suffix}</span>`:''}
      </div>
    </div>`,
  dateRow:(label,field)=>`
    <div class="flex items-center justify-between p-3 px-4 border-b border-[#EDEEF1] last:border-0 bg-white">
      <span class="text-[16px] font-semibold text-black">${label}</span>
      <input type="date" onchange="updateBirthDate(this.value)" value="${formData[field]}" class="text-right text-[16px] text-[#8E8E93] font-medium outline-none bg-transparent">
    </div>`,
  textarea:(field,placeholder)=>`
    <div class="bg-white rounded-[12px] p-5 shadow-sm border border-[#EDEEF1]">
      <textarea oninput="updateData('${field}', this.value)" class="w-full h-24 outline-none resize-none text-[16px] font-medium text-black placeholder:text-gray-300 bg-transparent" placeholder="${placeholder}">${formData[field]}</textarea>
    </div>`,
  segmentedControl:(field,options)=>`
    <div class="flex bg-[#F2F2F7] rounded-[9px] p-[3px] w-full">
      ${options.map(opt=>`<button onclick="setSegmented('${field}', '${opt}', this)" class="flex-1 py-2 text-[14px] rounded-[7px] transition-all duration-200 ${formData[field]===opt?'font-bold bg-white shadow-[0_3px_8px_rgba(0,0,0,0.12)] text-black':'font-medium text-[#8E8E93]'}">${opt}</button>`).join('')}
    </div>`,
  switchRow:(label,field)=>`
    <label class="flex items-center justify-between p-3 px-4 border-b border-[#EDEEF1] last:border-0 bg-white cursor-pointer active:bg-gray-50 transition-colors">
      <span class="text-[16px] font-semibold text-black">${label}</span>
      <div class="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" class="sr-only peer" onchange="updateData('${field}', this.checked)" ${formData[field]?'checked':''}>
        <div class="w-14 h-[31px] bg-[#E9E9EA] rounded-full peer-checked:bg-[#FFCC00] transition-colors duration-300 relative">
          <div class="absolute top-[2px] left-[2px] bg-white border border-gray-200 w-[27px] h-[27px] rounded-full shadow-[0_3px_8px_rgba(0,0,0,0.15)] transition-transform duration-300 peer-checked:translate-x-[25px]"></div>
        </div>
      </div>
    </label>`,
  checkRow:(label,category,value)=>`
    <label class="flex items-center justify-between p-3 px-4 border-b border-[#EDEEF1] bg-white cursor-pointer active:bg-gray-50 transition-colors">
      <span class="text-[15px] font-semibold text-black">${label}</span>
      <div class="relative flex items-center justify-center">
        <input type="checkbox" class="sr-only peer" onchange="updateCheck('${category}', '${value}', this.checked)" ${formData[category].includes(value)?'checked':''}>
        <i data-lucide="check" class="w-6 h-6 text-[#FFCC00] opacity-0 peer-checked:opacity-100 transition-opacity duration-200"></i>
      </div>
    </label>`,
  checkGrid:(items,category)=>`<div class="md:grid md:grid-cols-2 md:divide-x md:divide-[#EDEEF1]">${items.map(v=>UI.checkRow(v,category,v)).join('')}</div>`,
  checkWithNote:(label,boolField,noteField,notePlaceholder)=>`
    <div class="flex items-center justify-between p-3 px-4 border-b border-[#EDEEF1] last:border-0 bg-white gap-3">
      <label class="flex items-center gap-3 cursor-pointer shrink-0">
        <div class="relative flex items-center justify-center w-6 h-6">
          <input type="checkbox" class="sr-only peer" onchange="updateData('${boolField}', this.checked)" ${formData[boolField]?'checked':''}>
          <i data-lucide="check" class="w-6 h-6 text-[#FFCC00] opacity-0 peer-checked:opacity-100 transition-opacity duration-200"></i>
        </div>
        <span class="text-[15px] font-semibold text-black">${label}</span>
      </label>
      <input type="text" oninput="updateData('${noteField}', this.value)" value="${formData[noteField]}" class="flex-1 text-right text-[14px] text-[#8E8E93] outline-none bg-transparent placeholder:text-gray-300" placeholder="${notePlaceholder}">
    </div>`,
  header:(t)=>`<h2 class="text-[26px] font-extrabold tracking-tight text-black mb-1.5 mt-5 px-2 first:mt-0">${t}</h2>`,
  subhead:(t)=>`<div class="text-[13px] font-bold text-[#8E8E93] uppercase tracking-wider mb-1.5 mt-4 px-4">${t}</div>`
};


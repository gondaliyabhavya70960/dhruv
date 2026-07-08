export const copyText = async (e) => {
  const text = e.target.innerText;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.style.cssText = "width:1px;height:1px;background:transparent;position:absolute;left:-9999px";
    textArea.value = text;
    document.body.append(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
  }
};

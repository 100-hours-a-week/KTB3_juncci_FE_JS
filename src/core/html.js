export function html(strings, ...values) {
  const template = document.createElement('template');
  template.innerHTML = strings.map((s, i) => s + (values[i] ?? '')).join('');
  return template.content.firstElementChild;
}

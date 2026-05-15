export const FIRST_NAME_ALIASES = {
  александр: ['саша', 'саня', 'шура'],
  александра: ['саша', 'саня', 'шура'],
  алексей: ['леша', 'лёша', 'леха', 'лёха'],
  анастасия: ['настя', 'настья', 'ася'],
  анатолий: ['толик'],
  андрей: ['андрюша'],
  анна: ['аня', 'нюра'],
  антон: ['тоша'],
  арсений: ['сеня'],
  артем: ['тема', 'артемий', 'тёма', 'артём'],
  артемий: ['артем', 'тема', 'тёма', 'артём'],
  валентин: ['валя'],
  валентина: ['валя'],
  валерий: ['валера'],
  валерия: ['лера'],
  варвара: ['варя'],
  василий: ['вася'],
  вера: ['верочка'],
  вероника: ['ника'],
  виктор: ['витя'],
  виктория: ['вика'],
  владимир: ['вова', 'володя'],
  владислав: ['влад', 'слава'],
  вячеслав: ['слава'],
  георгий: ['гоша', 'жора'],
  григорий: ['гриша'],
  дарья: ['даша'],
  даниил: ['даня', 'данил', 'данила'],
  данил: ['даниил', 'даня', 'данила'],
  данила: ['даниил', 'даня', 'данил'],
  денис: ['ден'],
  дмитрий: ['дима', 'митя'],
  евгений: ['женя'],
  евгения: ['женя'],
  егор: ['егорка'],
  екатерина: ['катя'],
  елена: ['лена', 'алена'],
  елизавета: ['лиза'],
  иван: ['ваня'],
  илья: ['илюша'],
  ирина: ['ира'],
  кирилл: ['кирил'],
  константин: ['костя'],
  ксения: ['ксюша'],
  лидия: ['лида'],
  любовь: ['люба'],
  людмила: ['люда'],
  маргарита: ['рита'],
  мария: ['маша'],
  максим: ['макс'],
  михаил: ['миша'],
  надежда: ['надя'],
  наталия: ['наташа', 'наталья'],
  наталья: ['наташа', 'наталия'],
  никита: ['ник'],
  николай: ['коля'],
  оксана: ['ксана'],
  ольга: ['оля'],
  павел: ['паша'],
  петр: ['петя', 'пётр'],
  полина: ['поля'],
  роман: ['рома'],
  семен: ['сема', 'сёма'],
  сергей: ['сережа', 'серёжа'],
  софия: ['соня', 'софья'],
  софья: ['соня', 'софия'],
  станислав: ['стас'],
  степан: ['степа', 'стёпа'],
  татьяна: ['таня'],
  тимофей: ['тима'],
  ульяна: ['уля'],
  федор: ['федя', 'фёдор'],
  юлия: ['юля'],
  ярослав: ['ярик'],
};

export const FIRST_NAME_CANONICAL = Object.entries(FIRST_NAME_ALIASES).reduce(
  (acc, [canonical, aliases]) => {
    const norm = (v) => v.toLowerCase().replace(/ё/g, 'е').trim();
    acc[norm(canonical)] = norm(canonical);
    aliases.forEach((alias) => { acc[norm(alias)] = norm(canonical); });
    return acc;
  },
  {}
);

export function normalizePersonName(value) {
  return value.toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
}

function normalizeFirstName(value) {
  const normalized = normalizePersonName(value);
  return FIRST_NAME_CANONICAL[normalized] || normalized;
}

export function normalizeStudentSearchName(value) {
  const normalized = normalizePersonName(value);
  const parts = normalized.split(' ').filter(Boolean);
  if (parts.length !== 2) return normalized;
  return `${parts[0]} ${normalizeFirstName(parts[1])}`;
}

function getFirstNameVariants(value) {
  const normalized = normalizePersonName(value);
  const variants = new Set([normalized, normalizeFirstName(normalized)]);
  Object.entries(FIRST_NAME_ALIASES).forEach(([canonical, aliases]) => {
    const nc = normalizePersonName(canonical);
    const na = aliases.map(normalizePersonName);
    if (normalized === nc || na.includes(normalized)) {
      variants.add(nc);
      na.forEach((a) => variants.add(a));
    }
  });
  return Array.from(variants);
}

export function getStudentSearchNames(value) {
  const normalized = normalizePersonName(value);
  const parts = normalized.split(' ').filter(Boolean);
  if (parts.length !== 2) return [normalized];
  // Поддержка обоих порядков: "Фамилия Имя" и "Имя Фамилия"
  const direct = getFirstNameVariants(parts[1]).map((fn) => `${parts[0]} ${fn}`);
  const reversed = getFirstNameVariants(parts[0]).map((fn) => `${parts[1]} ${fn}`);
  return Array.from(new Set([...direct, ...reversed]));
}

export function validateSearchName(value) {
  const normalized = normalizePersonName(value);
  if (!normalized) return 'Введите фамилию и имя';
  if (/[^а-я\s]/.test(normalized)) return 'Используйте только русские буквы';
  const parts = normalized.split(' ').filter(Boolean);
  if (parts.length !== 2) return 'Введите фамилию и имя, два слова';
  if (parts.some((p) => p.length < 2)) return 'Фамилия и имя должны быть не короче 2 букв';
  return '';
}

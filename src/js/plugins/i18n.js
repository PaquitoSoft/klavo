import translations from '../../messages/translations';

const DEFAULT_LOCALE = 'es';

export function getText(key, locale = 'es') {
	let msg = translations[key];

	if (msg) {
		return msg[locale] || msg[DEFAULT_LOCALE];
	} else {
		return `__${key}__`;
	}
}

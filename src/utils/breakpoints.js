import { readable, derived } from 'svelte/store';

function mediaQuery(query) {
    return readable(false, (set) => {
        if (typeof window === 'undefined') {
            set(false);
            return;
        }

        const mql = window.matchMedia(query);
        set(mql.matches);

        const onChange = (e) => set(e.matches);
        mql.addEventListener('change', onChange);

        return () => mql.removeEventListener('change', onChange);
    });
}

export const isMobile = mediaQuery('(max-width: 767.98px)');
export const isTablet = mediaQuery('(min-width: 768px) and (max-width: 1023.98px)');
export const isDesktop = mediaQuery('(min-width: 1024px)');

export const breakpoint = derived(
    [isMobile, isTablet, isDesktop],
    ([$m, $t, $d]) => ($m ? 'mobile' : $t ? 'tablet' : 'desktop')
);

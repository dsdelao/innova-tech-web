# -*- coding: utf-8 -*-
"""Validador de balance de etiquetas. Contador real, no un no-op.

Un parser sin feed() tiene la pila vacia y siempre 'pasa': asi se colaron
16 falsos OK. Ademas <meta ... /> dispara handle_startendtag, que por defecto
llama a start+end, y como los voids no se apilan el endtag sale sobrante.
"""
import glob, sys
from html.parser import HTMLParser

VOID = {'meta', 'link', 'br', 'hr', 'img', 'input', 'source', 'area',
        'col', 'embed', 'param', 'track', 'wbr', 'base'}


class V(HTMLParser):
    def __init__(self):
        super().__init__()
        self.st, self.err = [], []

    def handle_startendtag(self, tag, attrs):
        pass                      # <meta ... /> ya viene cerrado: no apila nada

    def handle_starttag(self, tag, attrs):
        if tag not in VOID:
            self.st.append(tag)

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        if not self.st:
            self.err.append('sobrante </%s>' % tag)
        elif self.st[-1] != tag:
            self.err.append('esperaba </%s> llego </%s>' % (self.st[-1], tag))
            if tag in self.st:
                while self.st and self.st.pop() != tag:
                    pass
        else:
            self.st.pop()


def check(paths):
    bad = 0
    for f in sorted(paths):
        v = V()
        v.feed(open(f, encoding='utf-8').read())
        v.close()
        if v.err or v.st:
            bad += 1
            print('  MAL  %-46s %s %s' % (f, v.st or '', v.err or ''))
    total = len(list(paths))
    print('  %s' % ('%d/%d balanceadas' % (total - bad, total) if not bad
                    else '%d de %d con problema' % (bad, total)))
    return bad


if __name__ == '__main__':
    root = sys.argv[1] if len(sys.argv) > 1 else '/tmp/opencode/sel'
    sys.exit(1 if check(glob.glob(root + '/**/*.html', recursive=True)) else 0)

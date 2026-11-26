# Romae custom type

These are modified open-source fonts, not reproductions of Vivey or FHA Condensed French.

- **Romae Text** derives from Lora by Cyreal. Static instances use weights 440 (regular), 700 (bold), and 500 (italic). Outlines and advances are narrowed to 98%; word spaces are expanded by 8% before that scaling.
- **Romae French Display** derives from Bodoni Moda by indestructible type*. Weight 600 and optical size 48 are instanced, then outlines and advances are narrowed to 70%. Word spaces are expanded by 18% before scaling. Its high-contrast serifs and narrow proportions reference French poster lettering.

An original rupee glyph is added to every face for menu prices.

Both families have new internal family and PostScript names. Copyright and license metadata are retained. The original SIL Open Font License files are in `assets/fonts/`; the derivatives remain under the SIL OFL 1.1. Reserved upstream family names are not used as the derivative family names.

Sources: https://github.com/google/fonts/tree/main/ofl/lora and https://github.com/google/fonts/tree/main/ofl/bodonimoda

Rebuild with `python scripts/build_fonts.py` (Python and `fonttools[woff]` required; downloads upstream files). TTF files can be installed on a computer; WOFF2 files are served locally by the website. No external font request is needed. Character coverage is Latin/Latin Extended A and B, general punctuation, and supported currency symbols; upstream glyph coverage is preserved within that subset.

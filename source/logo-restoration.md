# Titanium logo restoration

Source: the original Titanium Training Center wordmark used by the live website, retained in the original project's `assets/logo.png` (572 × 102 pixels).

The final website asset is a transparent SVG traced from the original artwork. Its paths follow the original antialiased contours, retaining the original lettering, monogram, spacing and circuit details. It uses charcoal artwork on genuine transparency and scales without a fixed pixel resolution. A 4× transparent PNG export is also provided.

Saved deliverables:

- `source/media/titanium-logo.svg`: final website asset, containing scalable vector paths.
- `source/media/titanium-logo-transparent.png`: high-resolution transparent PNG export.
- `source/media/titanium-original.png`: original brand artwork retained for provenance.
- `source/trace-logo.py`: reproducible contour tracing; requires Pillow.

An imagegen restoration candidate was also reviewed during the work. The final SVG follows the source contours to keep the original identity. The built-in imagegen tool was used with the original logo as its edit reference and this prompt:

> Edit this exact Titanium Training Center company logo for production website use. Input image is the official existing white wordmark and stylized Ti circuit monogram on a black background. Remove the black background entirely, output genuine alpha transparency. Change ONLY all white foreground artwork to solid charcoal black (#20211F) so it works on a white website. Preserve the EXACT original monogram contours, circuit cuts, italic angular TITANIUM letterforms, spacing, proportions, and small TRAINING CENTER text. Do not redesign, reinterpret, add words or add symbols. Clean up raster edges and upscale to a crisp, high-resolution horizontal transparent logo at least 2400 pixels wide if supported, preserving the original very wide approximately 5.6:1 aspect ratio and compact original composition. No shadows, no background, no gradients, no extra padding. The exact text is TITANIUM and TRAINING CENTER. Faithful restoration of the supplied artwork, not a new logo.

Every website header and footer uses the final SVG.

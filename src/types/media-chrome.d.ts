// Type declarations for media-chrome v4 web components
import 'react';

type MediaChromeElement = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLElement>,
  HTMLElement
>;

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'media-controller': MediaChromeElement & { class?: string };
      'media-control-bar': MediaChromeElement;
      'media-play-button': MediaChromeElement;
      'media-seek-backward-button': MediaChromeElement & { seekoffset?: string };
      'media-seek-forward-button': MediaChromeElement & { seekoffset?: string };
      'media-mute-button': MediaChromeElement;
      'media-volume-range': MediaChromeElement;
      'media-time-range': MediaChromeElement & { class?: string };
      'media-time-display': MediaChromeElement & { showduration?: boolean };
      'media-fullscreen-button': MediaChromeElement;
      'media-loading-indicator': MediaChromeElement & { slot?: string };
    }
  }
}

import React from 'react';
import PropTypes from 'prop-types';
import he from 'he';
import { makeStyles } from '../mui';
import { getLayerFg, capStyle } from './styles';
import { useConfigureState } from '../state/configure';
import { useSettingsState } from '../state/settings';
import { mergeKeys, locales, DisplayKey, PredefinedKey } from '../../common/keys';

const useStyles = makeStyles(capStyle);

type CapProps = {
  cap: PredefinedKey;
  onClick?: (key: DisplayKey | null) => void;
};

export default function Cap(props: CapProps) {
  const classes = useStyles(props);
  const { cap, onClick } = props;
  const [ui] = useConfigureState('ui');
  const [locale] = useSettingsState('locale');
  const size = ui.sizeFactor * 4;
  const localized = locales[locale].keyname2key[cap.name] || {};
  const merged = mergeKeys(cap, localized);
  const color = getLayerFg(0);
  const label1 = merged ? merged.label1 || ' ' : cap.label;
  const label2 = (merged && merged.label2) || ' ';
  const style = ((merged && merged.style) ?? {}) as React.CSSProperties;

  function label(value: string, style: React.CSSProperties) {
    return (
      <div className={classes.label} style={{ ...style, ...{ color } }}>
        <span>{he.unescape(value)}</span>
      </div>
    );
  }

  return (
    <div className={classes.key} style={{ width: size, height: size, position: 'relative' }}>
      <div
        className={classes.base}
        style={{ width: size - 6, height: size - 6 }}
        onClick={() => !!onClick && onClick(merged)}
      >
        <div
          className={classes.cap}
          style={{ width: size - 10, height: size - 12, cursor: onClick ? 'pointer' : 'default' }}
        >
          {label(label2, style)}
          {label(label1, style)}
          {label('', {})}
        </div>
      </div>
    </div>
  );
}

Cap.propTypes = {
  cap: PropTypes.object.isRequired,
  onClick: PropTypes.func,
};

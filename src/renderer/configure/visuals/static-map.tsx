import React, { useState, useEffect } from 'react';
import { makeStyles, Button, MenuItem, Select, FormControl, InputLabel, Typography } from '../../mui';
import {
  useConfigureState,
  setConfigureState,
  addAnimation,
  updateAnimation,
  renameAnimation,
  setSelectedLeds,
  setAllLeds,
  LedStatus,
} from '../../state/configure';
import { AlterFieldModal } from '../../modal';
import { SwatchedChromePicker } from '../../common';
import _ from 'lodash';
import { ColorResult } from 'react-color';

const header = '### AUTO GENERATED - DO NOT EDIT - STATIC COLOR MAP ###;\n';
const settings = 'loop, replace:clear, framedelay:255';

type KeyGroups = 'none' | 'backlighting' | 'underlighting' | 'all';

const useStyles = makeStyles({
  container: {
    padding: 10,
    position: 'relative',
    minHeight: '20rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 20,
  },
  centeredRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    marginRight: 10,
  },
  actionButton: {
    marginLeft: 10,
  },
  animationSelect: {
    minWidth: '20rem',
    marginRight: '2rem',
  },
} as const);

type SelectChangeArgs = React.ChangeEvent<{
  name?: string | undefined;
  value: unknown;
}>;

export default function StaticMap(): JSX.Element {
  const classes = useStyles({});
  const [leds = []] = useConfigureState('leds');
  const [animations = {}] = useConfigureState('animations');
  const [selectedLeds] = useConfigureState('selectedLeds');
  const [ledStatus] = useConfigureState('ledStatus');

  const [active, setActive] = useState('');
  const [showRename, setShowRename] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const filteredAnimations = _.toPairs(animations).filter(([, animation]) => animation.type === 'static');

  const activeAnimation = active.length ? animations[active] : undefined;
  // const selectedAnimationChange = (e: React.ChangeEvent) => setActive(e.target.value as string);
  const selectedAnimationChange = (e: SelectChangeArgs) => setActive(e.target.value as string);

  useEffect(() => {
    const statuses: SparseArray<LedStatus> = {};
    if (activeAnimation) {
      const rx = /P\[(\d+)]\(\s*(\d+)s*,\s*(\d+)s*,\s*(\d+)s*\)/gm;
      let match;
      while ((match = rx.exec(activeAnimation.frames))) {
        const [id, r, g, b] = match.slice(1, 5).map((x) => parseInt(x));
        statuses[id] = { id, r, g, b };
      }
    }
    setAllLeds(statuses);
    return () => setConfigureState('ledStatus', {});
  }, [active]);

  const create = (save: boolean, name?: string) => {
    setShowNew(false);
    if (save && name) {
      addAnimation(name, 'static');
      updateAnimation(name, { settings, frames: header });
      setActive(name);
    }
  };

  const rename = (save: boolean, name?: string) => {
    setShowRename(false);
    if (save && name) {
      renameAnimation(active, name);
      setActive(name);
    }
  };

  const validateName = (name: string): Optional<string> => {
    if (animations[name]) {
      return 'An animation already exists with that name';
    }
    const rx = /^[A-Za-z_][A-Za-z0-9_]*$/;
    if (!name.length || !rx.test(name)) {
      return 'Invalid name - valid characters [A-Za-z0-9_] must not start with number';
    }
    return;
  };

  const select = (selection: KeyGroups) => {
    switch (selection) {
      case 'none':
        setSelectedLeds([]);
        break;
      case 'backlighting':
        setSelectedLeds(leds.filter((x) => !!x.scanCode).map((x) => x.id));
        break;
      case 'underlighting':
        setSelectedLeds(leds.filter((x) => !x.scanCode).map((x) => x.id));
        break;
      case 'all':
        setSelectedLeds(leds.map((x) => x.id));
        break;
    }
  };

  const color = _.head(selectedLeds.map((x) => ledStatus[x]).filter((x) => !!x)) || { r: 0, g: 0, b: 0 };
  const colorChange = (color: ColorResult) => {
    const statuses: SparseArray<LedStatus> = { ...ledStatus };
    _.forEach(selectedLeds, (x) => {
      statuses[x] = { id: x, ...color.rgb };
    });

    setAllLeds(statuses);

    const animation =
      _.toPairs(statuses)
        .map(([id, x]) => (x ? `P[${id}](${x.r},${x.g},${x.b})` : undefined))
        .filter((x) => !!x)
        .join(',\n') + ';';

    updateAnimation(active, { frames: `${header}${animation}` });
  };

  return (
    <form>
      <div className={classes.container}>
        <Typography variant="subtitle1">Static LED Visualization</Typography>

        <div className={classes.row}>
          <FormControl className={classes.animationSelect}>
            <InputLabel htmlFor="animation">Animation</InputLabel>
            <Select
              value={active}
              onChange={selectedAnimationChange}
              inputProps={{ name: 'animation', id: 'animation' }}
            >
              {filteredAnimations.map(([name]) => (
                <MenuItem key={name} value={name}>
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button className={classes.actionButton} onClick={() => setShowRename(true)} disabled={active.length === 0}>
            Rename
          </Button>
          <Button color="secondary" className={classes.actionButton} onClick={() => setShowNew(true)}>
            Add New
          </Button>
        </div>
        {!!activeAnimation && (
          <>
            <div className={classes.row}>
              {!selectedLeds.length && <Typography>No LEDs Selected.</Typography>}
              {!!selectedLeds.length && (
                <div className={classes.centeredRow}>
                  <Typography variant="subtitle1" className={classes.label}>
                    Current Color:
                  </Typography>
                  <SwatchedChromePicker color={color} onChange={colorChange} />
                </div>
              )}
            </div>
            <div className={classes.row} style={{ alignItems: 'center' }}>
              <Typography variant="subtitle1" className={classes.label}>
                Select:
              </Typography>
              <Button color="primary" onClick={() => select('backlighting')}>
                Backlighting
              </Button>
              <Button color="primary" onClick={() => select('underlighting')}>
                Underlighting
              </Button>
              <Button color="primary" onClick={() => select('all')}>
                All
              </Button>
              <Button color="primary" onClick={() => select('none')}>
                None
              </Button>
            </div>
          </>
        )}
        <AlterFieldModal
          open={showNew}
          value={''}
          name="Animation Name"
          saveText="Create"
          onClose={create}
          validation={validateName}
        />
        <AlterFieldModal
          open={showRename}
          value={active}
          name="Animation Name"
          saveText="Rename"
          onClose={rename}
          validation={validateName}
        />
      </div>
    </form>
  );
}

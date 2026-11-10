/** Reusable on-screen pieces (all extend Actor). Characters live in src/characters. */
export * from './ui/TextLabel';
export * from './ui/ParodyNotice';

// Drawn figures restored from before 89181ec: the "Portrait" versions of Mbappé (M1), Yamal (Y1), Kane (K1)
export { Character, type CharacterLook, type CharacterOptions, type CharacterVoice } from './characters/Character';
export { EXPRESSIONS, MOUTH_RANGE, type Expression } from './characters/expressions';
export { DEFAULT_FACE, type FaceFeatures } from './characters/face';
export { Sky, type SkyOptions } from './environment/Sky';
export { FIGURE_BUILDS, FIGURE_REST, type FigureBuild, type FigureBuildName, type FigurePart } from './figures/body';
export { COSTUMES, type Costume, type CostumeName } from './figures/costumes';
export { FIGURE_EXPRESSIONS, type FaceSpec, type FigureExpression } from './figures/expressions';
export { createMbappePortrait, MBAPPE, MbappeFigure } from './figures/players/mbappe';
export { BAYERN_KIT, createKanePortrait, ENGLAND_KIT, KANE, KaneFigure } from './figures/players/kane';
export { BARCA_KIT, createYamalPortrait, SPAIN_KIT, YAMAL, YamalFigure } from './figures/players/yamal';
export { createPortrait, PortraitFigure, type FigureSpec, type PortraitFigureOptions, type ShortsStyle } from './figures/PortraitFigure';
export { Ball, type BallOptions } from './sport/Ball';
export { Footballer, type FootballerOptions, type Kit } from './sport/Footballer';
export { Goal, type GoalOptions } from './sport/Goal';
export { AdBoards, Pitch, type AdBoardsOptions, type PitchOptions } from './sport/Pitch';
export { Referee } from './sport/Referee';
export { Stands, type StandsOptions } from './sport/Stands';
export { Trophy, type TrophyOptions } from './sport/Trophy';
export { SpeechBubble, type SpeechBubbleOptions } from './ui/SpeechBubble';
export { SvgArt, type SvgArtOptions } from './SvgArt';

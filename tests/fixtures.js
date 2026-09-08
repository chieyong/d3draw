import fs from 'node:fs'
import { csvParse, autoType } from 'd3'
import { withDerived } from '../src/renderer/derive'

export const spec = () =>
  JSON.parse(fs.readFileSync('src/spec/happiness-garden.json', 'utf8'))

export const rows = () =>
  csvParse(fs.readFileSync('public/world_happiness_sample_2015-2024.csv', 'utf8'), autoType)

export const data = (s = spec()) => withDerived(rows(), s)

export type DataPoint = {
  id: string
  label: string
  value: string
  category: 'core_outcomes' | 'volume_enrollment' | 'demographics' | 'benchmarks' | 'trends'
  selected: boolean
}

export type AnalysisResult = {
  categories: {
    core_outcomes:     DataPoint[]
    volume_enrollment: DataPoint[]
    demographics:      DataPoint[]
    benchmarks:        DataPoint[]
    trends:            DataPoint[]
  }
  insights: string[] // always exactly 3 items
}


import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://goyonrowhfphooryfzif.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdveW9ucm93aGZwaG9vcnlmemlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTYxMTA4NywiZXhwIjoyMDgxMTg3MDg3fQ.O49nmTt-80E0oAx70B_QYMU7rZpcoe26x5FQr6IuKnU'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugProject() {
    const projectId = 'ffa4ffb6-c9e8-4d20-b293-21401b7d8f5c'

    console.log('Fetching project:', projectId)

    // 1. Fetch project with join
    const { data: project, error } = await supabase
        .from('projects')
        .select('*, project_assessments(*)')
        .eq('id', projectId)
        .single()

    if (error) {
        console.error('Error fetching project:', error)
        return
    }

    console.log('Project Data:', {
        id: project.id,
        title: project.title,
        agency: project.agency,
        deadline: project.deadline
    })

    console.log('Assessment Data Raw Type:', typeof project.project_assessments)
    console.log('Assessment Data Is Array:', Array.isArray(project.project_assessments))

    if (project.project_assessments) {
        const assessments = Array.isArray(project.project_assessments)
            ? project.project_assessments
            : [project.project_assessments];

        console.log('Assessments Count:', assessments.length)
        if (assessments.length > 0) {
            const first = assessments[0];
            console.log('First Assessment ID:', first.id)
            console.log('Basic Info keys:', Object.keys(first.basic_info || {}))
            console.log('Basic Info Content keys:', Object.keys(first.basic_info?.content || {}))

            const agency = first.basic_info?.content?.['主辦機關']
            console.log('Agency Data:', JSON.stringify(agency, null, 2))

            const deadline = first.dates?.content?.['投標截止']
            console.log('Deadline Data:', JSON.stringify(deadline, null, 2))
        }
    } else {
        console.log('No project_assessments joined.')
    }
}

debugProject()

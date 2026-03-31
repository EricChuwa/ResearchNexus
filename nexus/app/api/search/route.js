import { fetchSources } from '../../lib/fetchSources'

export async function GET(request) {
  const { searchParams } = request.nextUrl
  const query = searchParams.get('q')

  if (!query) {
    return Response.json(
      { error: 'Query parameter is required' },
      { status: 400 }
    )
  }

  try {
    const results = await fetchSources(query, 'research', 10)
    return Response.json({ results })
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
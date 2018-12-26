const ALL_LINKED_ARTISTS = `
SELECT DISTINCT ?uri MIN(?n) as ?name COUNT(DISTINCT ?wikicatA) as ?common COUNT(DISTINCT ?wikicatB) as ?degree group_concat(distinct ?wikicatA;separator="; ") as ?categories WHERE {
 	<%URI> a ?wikicatA .
	?uri a ?wikicatA, ?wikicatB, ?type ;
   	foaf:name ?n .
 	VALUES ?type {
 		dbpo:Band dbpo:MusicArtist dbp-yago:Composer109947232 yago:Musician110340312
 	}
 	FILTER(REGEX(STR(?wikicatA),"http://dbpedia.org/class/yago/Wikicat"))
	FILTER(?wikicatA != <http://dbpedia.org/class/yago/WikicatLivingPeople>)
	FILTER(?wikicatA != <http://dbpedia.org/class/yago/WikicatWomen>)
 	FILTER(REGEX(STR(?wikicatB),"http://dbpedia.org/class/yago/Wikicat"))
	FILTER(?wikicatB != <http://dbpedia.org/class/yago/WikicatLivingPeople>)
	FILTER(?wikicatB != <http://dbpedia.org/class/yago/WikicatWomen>)
  FILTER (LANG(?n)="en" || LANG(?n)="" )
  FILTER (?uri != <%URI>)
} GROUP BY ?uri ORDER BY DESC(?common) ASC(?degree)
`;

const ALL_MOODPLAY_ARTISTS = `
SELECT DISTINCT ?mbid ?name
WHERE
{
 	?maker mo:musicbrainz_guid ?mbid ;
    	 foaf:name ?name .
}
`;

const ARTIST_ABSTRACT = `
SELECT DISTINCT ?about ?abs ?dbpedia_uri WHERE {
  {
    SELECT ?about ?abs ?dbpedia_uri WHERE {
      <%URI> dbpo:wikiPageRedirects ?dbpedia_uri .
      ?dbpedia_uri foaf:isPrimaryTopicOf ?about ;
        dbpo:abstract ?abs .
    }
  }
  UNION
  {
    SELECT ?about ?abs ?dbpedia_uri WHERE {
      <%URI> foaf:isPrimaryTopicOf ?about ;
        dbpo:abstract ?abs .
      BIND(<%URI> as ?dbpedia_uri)
    }
  }
  FILTER( LANG(?abs)="%LANG" || LANG(?abs)="") .
}
`;

const ARTIST_CATEGORIES = `
SELECT DISTINCT ?yago WHERE {
  {
    SELECT ?yago WHERE { <%URI> dbpo:wikiPageRedirects ?dbpedia_uri . ?dbpedia_uri a ?yago . }
  }
  UNION
  {
    SELECT ?yago WHERE { <%URI> a ?yago . }
  }
FILTER(REGEX(STR(?yago),"http://dbpedia.org/class/yago/Wikicat"))
FILTER(?yago != <http://dbpedia.org/class/yago/WikicatLivingPeople>)
FILTER(?yago != <http://dbpedia.org/class/yago/WikicatWomen>)
}
`;

const ARTIST_REDIRECT = `
SELECT ?dbpedia_uri ?redirected_uri WHERE {
  <%URI> dbpo:wikiPageRedirects ?dbpedia_uri .
  BIND(<%URI> as ?redirected_uri)
}
`

const ASSOCIATED_ARTISTS = `
SELECT DISTINCT ?dbpedia_uri ?name WHERE {
 { <%URI> dbpo:associatedMusicalArtist ?dbpedia_uri  }
 UNION
 { <%URI> dbpo:associatedBand ?dbpedia_uri }
 ?dbpedia_uri foaf:name ?name .
 FILTER( LANG(?name)="%LANG" || LANG(?name)="") .
}
`;

const CATEGORY_DEGREES = `
SELECT ?wikicat COUNT(DISTINCT ?name) as ?degree WHERE {
	<%URI> a ?wikicat .
  ?uri a ?wikicat, ?type ;
      foaf:name ?name .
    VALUES ?type {
      dbpo:Band dbpo:MusicArtist dbp-yago:Composer109947232 yago:Musician110340312
    }
	FILTER(REGEX(STR(?wikicat),"http://dbpedia.org/class/yago/Wikicat"))
  	FILTER(?wikicat != <http://dbpedia.org/class/yago/WikicatLivingPeople>)
  	FILTER(?wikicat != <http://dbpedia.org/class/yago/WikicatWomen>)
} GROUP BY ?wikicat ORDER BY ?degree
`;

const CONSTRUCT_ARTIST = `
PREFIX dbpo: <http://dbpedia.org/ontology/>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

CONSTRUCT {
   <%URI> dbpo:abstract ?abstract ;
      dbpo:wikiPageRedirects ?dbpedia_uri ;
      dbpo:about ?about ;
      dbpo:genre ?genre_uri ;
      dbpo:associatedMusicalArtist ?assoc_uri ;
      a ?wikicat .
    ?genre_uri rdfs:label ?genre .
    ?assoc_uri foaf:name ?assoc .
}
WHERE {
  {
    SELECT ?about ?abstract ?dbpedia_uri ?wikicat ?genre_uri ?genre ?assoc_uri ?assoc WHERE {
      <%URI> dbpo:wikiPageRedirects ?dbpedia_uri .
      ?dbpedia_uri a ?wikicat ;
        foaf:isPrimaryTopicOf ?about ;
        dbpo:abstract ?abstract .
      OPTIONAL { <%URI> dbpo:genre ?genre_uri .  ?genre_uri rdfs:label ?genre . }
      OPTIONAL { <%URI> dbpo:associatedMusicalArtist ?assoc_uri . ?assoc_uri foaf:name ?assoc . }
      OPTIONAL { <%URI> a ?wikicat . FILTER(REGEX(STR(?wikicat),"http://dbpedia.org/class/yago/Wikicat")) }
    }
  }
  UNION
  {
    SELECT ?about ?abstract ?dbpedia_uri ?wikicat ?genre_uri ?genre ?assoc_uri ?assoc WHERE {
      <%URI> a ?wikicat ;
        foaf:isPrimaryTopicOf ?about ;
        dbpo:abstract ?abstract .
      OPTIONAL { <%URI> dbpo:genre ?genre_uri .  ?genre_uri rdfs:label ?genre . }
      OPTIONAL { <%URI> dbpo:associatedMusicalArtist ?assoc_uri . ?assoc_uri foaf:name ?assoc . }
      OPTIONAL { <%URI> a ?wikicat . FILTER(REGEX(STR(?wikicat),"http://dbpedia.org/class/yago/Wikicat")) }
      BIND(<%URI> as ?dbpedia_uri)
    }
  }
  FILTER(?wikicat != <http://dbpedia.org/class/yago/WikicatLivingPeople>)
  FILTER(?wikicat != <http://dbpedia.org/class/yago/WikicatWomen>)
  FILTER( LANG(?abstract)="en" || LANG(?abstract)="")
  FILTER( LANG(?genre)="en" || LANG(?genre)="" )
  FILTER( LANG(?assoc)="en" || LANG(?assoc)="" )
}
`;

const DESCRIBE_ARTIST = `
DESCRIBE ?uri
WHERE {
  {
    SELECT ?uri ?p ?o WHERE {
      <%URI> dbpo:wikiPageRedirects ?uri .
      ?uri ?p ?o .
    }
  }
  UNION
  {
    SELECT ?uri ?p ?o WHERE {
      <%URI> ?p ?o .
      BIND(<%URI> as ?uri)
    }
  }
  FILTER( LANG(?o)="en" || LANG(?o)="")
}
`;

const IMAGE_BY_MBID = `
SELECT ?entity_id ?image_uri WHERE {
  ?statement ps:P434 "%MBID" .
  ?entity_id p:P434 ?statement ;
    p:P18 ?image_statement .
  ?image_statement ps:P18 ?image_uri .
}
`;

const MBID_BY_ENTITYID = `
SELECT ?mbid WHERE {
  ?statement ps:P434 ?mbid .
  wd:%ENTITYID p:P434 ?statement .
}
`;

const MOODPLAY_ARTISTS = `
SELECT ?artist ?mbid
WHERE
{
  SELECT ?artist ?mbid (AVG(?valence) as ?avg_valence) (AVG(?arousal) as ?avg_arousal) ((ABS(AVG(?target_valence)-AVG(?valence)) + ABS(AVG(?target_arousal)-AVG(?arousal))) / 2 as ?diff)
  WHERE {
    {
      SELECT ?target_valence ?target_arousal
      WHERE {
      	?target_coords mood:valence ?target_valence ;
          mood:arousal ?target_arousal ;
          mood:configuration mood:actfold4 .
        ?target_lfmid mood:coordinates ?target_coords ;
          mood:artist_name ?target_artist .
        FILTER(LCASE(?target_artist) = LCASE("%ARTIST"))
      }
    }
    ?coords mood:valence ?valence ;
      mood:arousal ?arousal ;
      mood:configuration mood:actfold4 .
    ?lfmid mood:coordinates ?coords ;
      foaf:maker ?maker ;
      mood:artist_name ?artist .
    ?maker mo:musicbrainz_guid ?mbid .
    FILTER(LCASE(?artist) != LCASE("%ARTIST"))
  } GROUP BY ?artist ?mbid ORDER BY ?diff
} LIMIT %LIMIT
`;

const MOODPLAY_NEAREST_TRACK = `
SELECT ?artist ?title ?filename ?diff ?valence ?arousal
WHERE
{
  SELECT ?artist ?title ?filename ?valence ?arousal ((ABS(%VALENCE-?valence) + ABS(%AROUSAL-?arousal)) as ?diff)
  WHERE {
    ?coords mood:valence ?valence ;
      mood:arousal ?arousal ;
      mood:configuration mood:actfold4 .
    ?lfmid mood:coordinates ?coords ;
      mood:ilm_id ?ilmid ;
      mood:artist_name ?artist ;
      mood:song_title ?title ;
      mo:available_as ?fileid .
    ?fileid mood:filename ?filename .
  } ORDER BY ?diff
} LIMIT 1
`

const WIKICAT_LINKS = `
SELECT DISTINCT ?uri ?name WHERE {
 ?uri a <%YAGO_URI> ;
   foaf:name ?name .
 { ?uri a dbpo:Band } UNION { ?uri a dbpo:MusicArtist } UNION { ?uri a dbp-yago:Composer109947232 } UNION { ?uri a yago:Musician110340312 }
 FILTER(?uri != <%ARTIST_URI>) .
} LIMIT %LIMIT
`;

module.exports.queries = {
  "all_linked_artists": ALL_LINKED_ARTISTS,
  "all_moodplay_artists": ALL_MOODPLAY_ARTISTS,
  "artist_abstract": ARTIST_ABSTRACT,
  "artist_categories": ARTIST_CATEGORIES,
  "artist_redirect": ARTIST_REDIRECT,
  "associated_artists": ASSOCIATED_ARTISTS,
  "category_degrees": CATEGORY_DEGREES,
  "construct_artist": CONSTRUCT_ARTIST,
  "describe_artist": DESCRIBE_ARTIST,
  "image_by_mbid": IMAGE_BY_MBID,
  "mbid_by_entityid": MBID_BY_ENTITYID,
  "moodplay_artists": MOODPLAY_ARTISTS,
  "moodplay_nearest_track": MOODPLAY_NEAREST_TRACK,
  "wikicat_links": WIKICAT_LINKS
}

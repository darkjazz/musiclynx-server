const IMAGE_BY_MBID = `
SELECT ?entity_id ?image_uri WHERE {
  ?statement ps:P434 "%MBID" .
  ?entity_id p:P434 ?statement ;
    p:P18 ?image_statement .
  ?image_statement ps:P18 ?image_uri .
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

const ASSOCIATED_ARTISTS = `
SELECT DISTINCT ?dbpedia_uri ?name WHERE {
 { ?dbpedia_uri dbpo:associatedMusicalArtist <%URI> }
 UNION
 { ?dbpedia_uri dbpo:associatedBand <%URI> }
 ?dbpedia_uri rdfs:label ?name .
 FILTER( LANG(?name)="%LANG" || LANG(?name)="") .
}
`;

const ARTIST_CATEGORIES = `
SELECT DISTINCT ?yago WHERE {
 <%URI> a ?yago .
FILTER(REGEX(STR(?yago),"http://dbpedia.org/class/yago/Wikicat"))
FILTER(?yago != <http://dbpedia.org/class/yago/WikicatLivingPeople>)
FILTER(?yago != <http://dbpedia.org/class/yago/WikicatWomen>)
}
`;

const ALL_LINKED_ARTISTS = `
SELECT DISTINCT ?uri MIN(?name) as ?artist COUNT(DISTINCT ?wikicat) as ?common group_concat(distinct ?wikicat;separator="; ") as ?uris WHERE {
 	<%URI> a ?wikicat .
	?uri a ?wikicat, ?type ;
   		foaf:name ?name .
   	VALUES ?type {
   		dbpo:Band dbpo:MusicArtist dbp-yago:Composer109947232 yago:Musician110340312
   	}
 	FILTER (LANG(?name)="en" || LANG(?name)="" )
   	FILTER(REGEX(STR(?wikicat),"http://dbpedia.org/class/yago/Wikicat"))
  	FILTER(?wikicat != <http://dbpedia.org/class/yago/WikicatLivingPeople>)
  	FILTER(?wikicat != <http://dbpedia.org/class/yago/WikicatWomen>)
 	FILTER (?uri != <%URI>)
} GROUP BY ?uri ORDER BY DESC(?common)
`

const WIKICAT_LINKS = `
SELECT DISTINCT ?uri ?name WHERE {
 ?uri a <%YAGO_URI> ;
   foaf:name ?name .
 { ?uri a dbpo:Band } UNION { ?uri a dbpo:MusicArtist } UNION { ?uri a dbp-yago:Composer109947232 } UNION { ?uri a yago:Musician110340312 }
 FILTER(?uri != <%ARTIST_URI>) .
} LIMIT %LIMIT
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

CONSTRUCT_ARTIST = `
CONSTRUCT {
   <%URI> dbpo:abstract ?abstract ;
      dbpo:wikiPageRedirects ?dbpedia_uri ;
      dbpo:about ?about ;
      foaf:name ?name ;
      dbpo:genre ?genre_uri ;
      dbpo:associatedMusicalArtist ?assoc_uri ;
      foaf:depiction ?image ;
      dbpo:thumbnail ?thumbnail ;
      a ?wikicat .
    ?genre_uri rdfs:label ?genre .
    ?assoc_uri foaf:name ?assoc .
}
WHERE {
  {
    SELECT ?about ?abstract ?dbpedia_uri ?name ?wikicat ?genre_uri ?genre ?assoc_uri ?assoc ?image ?thumbnail WHERE {
      <%URI> dbpo:wikiPageRedirects ?dbpedia_uri .
      ?dbpedia_uri a ?wikicat ;
        foaf:isPrimaryTopicOf ?about ;
        foaf:name ?name ;
        dbpo:abstract ?abstract .
      OPTIONAL { <%URI> dbpo:genre ?genre_uri .  ?genre_uri rdfs:label ?genre . }
      OPTIONAL { <%URI> dbpo:associatedMusicalArtist ?assoc_uri . ?assoc_uri foaf:name ?assoc . }
      OPTIONAL { <%URI> foaf:depiction ?image . }
      OPTIONAL { <%URI> dbpo:thumbnail ?thumbnail . }
    }
  }
  UNION
  {
    SELECT ?about ?abstract ?dbpedia_uri ?name ?wikicat ?genre_uri ?genre ?assoc_uri ?assoc ?image ?thumbnail WHERE {
      <%URI> a ?wikicat ;
        foaf:isPrimaryTopicOf ?about ;
        foaf:name ?name ;
        dbpo:abstract ?abstract .
      OPTIONAL { <%URI> dbpo:genre ?genre_uri .  ?genre_uri rdfs:label ?genre . }
      OPTIONAL { <%URI> dbpo:associatedMusicalArtist ?assoc_uri . ?assoc_uri foaf:name ?assoc . }
      OPTIONAL { <%URI> foaf:depiction ?image . }
      OPTIONAL { <%URI> dbpo:thumbnail ?thumbnail . }
      BIND(<%URI> as ?dbpedia_uri)
    }
  }

  FILTER(REGEX(STR(?wikicat),"http://dbpedia.org/class/yago/Wikicat"))
  FILTER(?wikicat != <http://dbpedia.org/class/yago/WikicatLivingPeople>)
  FILTER(?wikicat != <http://dbpedia.org/class/yago/WikicatWomen>)
  FILTER( LANG(?abstract)="%LANG" || LANG(?abstract)="")
  FILTER( LANG(?name)="%LANG" || LANG(?name)="" )
  FILTER( LANG(?genre)="%LANG" || LANG(?genre)="" )
  FILTER( LANG(?assoc)="%LANG" || LANG(?assoc)="" )
}
`

DESCRIBE_ARTIST = `
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
`

ALL_MOODPLAY_ARTISTS = `
SELECT DISTINCT ?mbid ?name
WHERE
{
 	?maker mo:musicbrainz_guid ?mbid ;
    	 foaf:name ?name .
}
`

module.exports.queries = {
  "image_by_mbid": IMAGE_BY_MBID,
  "artist_abstract": ARTIST_ABSTRACT,
  "associated_artists": ASSOCIATED_ARTISTS,
  "mbid_by_entityid": MBID_BY_ENTITYID,
  "artist_categories": ARTIST_CATEGORIES,
  "wikicat_links": WIKICAT_LINKS,
  "moodplay_artists": MOODPLAY_ARTISTS,
  "construct_artist": CONSTRUCT_ARTIST,
  "describe_artist": DESCRIBE_ARTIST,
  "all_moodplay_artists": ALL_MOODPLAY_ARTISTS,
  "all_linked_artists": ALL_LINKED_ARTISTS
}

import React from 'react';
import axios from 'axios';
import InfoIcon from '@material-ui/icons/Info';
import Pagination from '@material-ui/lab/Pagination';
import {
    GridList,
    GridListTile,
    ListSubheader,
    GridListTileBar,
    TextField,
    Paper,
    Chip,
    IconButton,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Modal,
} from '@material-ui/core';

const api = {
    pokemon: 'https://pokeapi.co/api/v2/pokemon/',
    type: 'https://pokeapi.co/api/v2/type/',
};

const colors = {
    normal: 'gray',
    fighting: 'brown',
    flying: 'lightblue',
    poison: 'purple',
    ground: 'lightgray',
    rock: 'darkgoldenrod',
    bug: 'lightgreen',
    ghost: 'darkblue',
    steel: 'darkgrey',
    fire: 'red',
    water: 'blue',
    grass: 'green',
    electric: 'yellow',
    psychic: 'pink',
    ice: 'cyan',
    dragon: 'lightslategray',
    dark: 'dimgray',
    fairy: 'lightpink',
    unknown: '',
    shadow: 'slategray',
};

const getPokemonList = (limit, offset) =>
    axios.get(api.pokemon + `?limit=${limit}&offset=${offset}`);

const getPokemon = (name) => axios.get(api.pokemon + name);

const getPokemonListByType = (name) => axios.get(api.type + name);

const removeDuplicates = (pokemons) => {
    const seen = {};
    const out = [];
    let j = 0;
    for (let i = 0; i < pokemons.length; i++) {
        if (seen[pokemons[i].id] !== 1) {
            seen[pokemons[i].id] = 1;
            out[j++] = pokemons[i];
        }
    }
    return out;
};

const App = () => {
    const [search, setSearch] = React.useState('');
    const [types, setTypes] = React.useState([]);
    const [pokemons, setPokemons] = React.useState([]);
    const [limit, setLimit] = React.useState(10);
    const [offset, setOffset] = React.useState(0);
    const [pokemonCount, setPokemonCount] = React.useState(1);
    const [isModalOpen, setModalOpen] = React.useState(false);

    React.useEffect(() => {
        if (!types.length)
            getPokemonList(limit, offset)
                .then(({ data: { count = 1, results = [] } = {} } = {}) => {
                    setPokemonCount(count);
                    return results;
                })
                .then((pokemonList) =>
                    Promise.all(pokemonList.map(({ name = '' }) => getPokemon(name)))
                )
                .then((result) => setPokemons(result.map(({ data = {} }) => data)));
    }, [limit, offset, types]);

    const handleSearch = (event) => {
        getPokemon(search)
            .then(({ data }) => setPokemons(removeDuplicates([data, ...pokemons])))
            .catch(() =>
                setPokemons(
                    removeDuplicates([
                        { id: 'not found', name: search + ' not found' },
                        ...pokemons,
                    ])
                )
            );
        event.preventDefault();
    };

    const handleSearchChange = (event) => {
        setSearch(event.target.value);
    };

    const handleDelete = (type) => () => {
        setPokemons(
            pokemons.filter(
                ({ types: pTypes }) => !pTypes.find(({ type: { name } }) => name === type)
            )
        );
        setTypes(types.filter((t) => t !== type));
    };

    const handleTypeClick = (type) => () => {
        if (!types.length) {
            setPokemons([]);
        }
        if (!types.find((t) => t === type)) {
            getPokemonListByType(type)
                .then(({ data: { pokemon = [] } = {} } = {}) => pokemon)
                .then((pokemonList) =>
                    Promise.all(pokemonList.map(({ pokemon: { name = '' } }) => getPokemon(name)))
                )
                .then((result) => {
                    const newPokemons = result.map(({ data = {} }) => data);
                    setPokemons(
                        types.length ? removeDuplicates([...pokemons, ...newPokemons]) : newPokemons
                    );
                    setTypes([...types, type]);
                });
        }
    };

    const handlePageChange = (event, page) => {
        setPokemons([]);
        setOffset((page - 1) * limit);
    };

    const handleLimitChange = (event) => {
        setPokemons([]);
        setLimit(event.target.value);
    };

    const handleModalOpen = (stats) => () => {
        setModalOpen(stats);
    };

    const handleModalClose = () => {
        setModalOpen(false);
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
            <div style={{ maxWidth: '500px' }}>
                <GridList cellHeight={180}>
                    <GridListTile key={'Subheader'} cols={2} style={{ height: 'auto' }}>
                        <ListSubheader component={'div'}>
                            {pokemons.length ? 'Pokedex' : 'loading...'}
                        </ListSubheader>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <form noValidate autoComplete="off" onSubmit={handleSearch}>
                                <TextField
                                    label={'Search'}
                                    size={'small'}
                                    onChange={handleSearchChange}
                                />
                            </form>
                            <Paper component="div" style={{ background: 'rgba(0, 0, 0, 0.5)' }}>
                                {types.map((type) => (
                                    <Chip
                                        key={type}
                                        label={type}
                                        onDelete={handleDelete(type)}
                                        size={'small'}
                                        style={{
                                            background: colors[type],
                                            margin: '5px',
                                        }}
                                    />
                                ))}
                            </Paper>
                        </div>
                    </GridListTile>
                    {pokemons.map(
                        ({
                            id,
                            name,
                            sprites: { front_default: avatar } = {},
                            types: pTypes = [],
                            stats,
                        }) => (
                            <GridListTile key={id}>
                                <img src={avatar} alt={name} />
                                <GridListTileBar
                                    title={name}
                                    subtitle={
                                        <div>
                                            {pTypes.map(({ type: { name: typeName } }) => (
                                                <Chip
                                                    key={typeName}
                                                    size={'small'}
                                                    style={{
                                                        background: colors[typeName],
                                                        margin: '1px',
                                                    }}
                                                    label={typeName}
                                                    onClick={handleTypeClick(typeName)}
                                                />
                                            ))}
                                        </div>
                                    }
                                    actionIcon={
                                        <IconButton onClick={handleModalOpen(stats)}>
                                            <InfoIcon />
                                        </IconButton>
                                    }
                                />
                            </GridListTile>
                        )
                    )}
                </GridList>
            </div>
            {types.length ? null : (
                <div style={{ display: 'flex' }}>
                    <Pagination
                        style={{ marginTop: '18px' }}
                        size={'small'}
                        count={Math.ceil(pokemonCount / limit)}
                        page={Math.ceil(offset / limit) + 1}
                        onChange={handlePageChange}
                    />
                    <FormControl>
                        <InputLabel style={{ marginTop: '10px' }}>size</InputLabel>
                        <Select value={limit} onChange={handleLimitChange}>
                            <MenuItem value={10}>10</MenuItem>
                            <MenuItem value={20}>20</MenuItem>
                            <MenuItem value={50}>50</MenuItem>
                        </Select>
                    </FormControl>
                </div>
            )}
            <Modal
                open={!!isModalOpen}
                onClose={handleModalClose}
                style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div
                    style={{
                        background: 'darkgrey',
                        padding: '5px 20px 0 5px',
                        border: '1px solid black',
                    }}>
                    Stats:
                    <ul>
                        {isModalOpen &&
                            isModalOpen.map(({ stat: { name }, base_stat: value }) => (
                                <li key={name}>{`${name}: ${value}`}</li>
                            ))}
                    </ul>
                </div>
            </Modal>
        </div>
    );
};

export default App;

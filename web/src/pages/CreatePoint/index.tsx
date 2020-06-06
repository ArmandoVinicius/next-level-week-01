import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import Dropzone from '../../components/dropzone';

import { Link, useHistory } from 'react-router-dom';

import { Map, TileLayer, Marker } from 'react-leaflet';
import { LeafletMouseEvent } from 'leaflet';

import axios from 'axios';
import api from '../../services/api';

import { FiArrowLeft } from 'react-icons/fi'
import logo from '../../assets/logo.svg';

import './styles.css';

interface Item {
    id: number;
    title: string;
    image_url: string;
}

interface IBGEUFResponse {
    sigla: string;
}

interface IBGECityResponse {
    nome: string;
}

const CreatePoint = () => {
    const [ items, setItems ] = useState<Item[]>([]);
    const [ ufs, setUfs ] = useState<string[]>([]);
    const [ cities, setCities ] = useState<string[]>([]);
    
    const [ formData, setFormData ] = useState({
        name: '',
        email: '',
        whatsapp: ''
    });

    const [ initialPos, setInitialPos ] = useState<[number, number]>([0, 0]);
    
    const [ selectedUf, setSelectedUf ] = useState('0');
    const [ selectedCity, setSelectedCity ] = useState('0');
    const [ selectedItens, setSelectedItens ] = useState<number[]>([]);
    const [ selectedPos, setSelectedPos ] = useState<[number, number]>([0, 0]);
    const [ selectedFile, setSelectedFile ] = useState<File>(); 
    
    const history = useHistory();

    useEffect(()=>{
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;

            setInitialPos([ latitude, longitude ]);
        });
    }, [])

    useEffect(() => {
        api.get('items').then(response => {
            setItems(response.data);
        })
    }, []);

    useEffect(() => {
        axios
        .get<IBGEUFResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
        .then(response => {
            const ufInitials = response.data.map(uf => uf.sigla)
            
            setUfs(ufInitials);
        });
    }, []);

    useEffect(()=> {
        if( selectedUf === '0' ) return;

        axios
            .get<IBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`)
            .then(response => {
                const cityNames = response.data.map(city => city.nome)
                
                setCities(cityNames);
            });
    }, [selectedUf]);
    
    function handleSelectedUf(e: ChangeEvent<HTMLSelectElement>) {
        const uf = e.target.value;

        setSelectedUf(uf);
    }

    function handleSelectedCity(e: ChangeEvent<HTMLSelectElement>) {
        const city = e.target.value;

        setSelectedCity(city);
    }

    function handleMapClick(e: LeafletMouseEvent) {
        setSelectedPos([
            e.latlng.lat, e.latlng.lng
        ])
    }

    function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
        const { name, value } = e.target
        
        setFormData({...formData, [name]: value });
    }

    function handleSelectItem(id: number) {
        const alreadySelected = selectedItens.findIndex(item => item === id);

        if(alreadySelected >= 0) {
            const filteredItens = selectedItens.filter(item => item !== id);

            setSelectedItens(filteredItens);
        } else {
            setSelectedItens([ ...selectedItens, id ]);
        }
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        
        const { name, email, whatsapp } = formData;
        const uf = selectedUf;
        const city = selectedCity
        const [ latitude, longitude ] = selectedPos;
        const items = selectedItens;

        const data = new FormData();

        data.append('name', name);
        data.append('email', email);
        data.append('whatsapp', whatsapp);
        data.append('uf', uf);
        data.append('city', city);
        data.append('latitude', String(latitude));
        data.append('longitude', String(longitude));
        data.append('items', items.join(','));
        
        if(selectedFile) {
            data.append('image', selectedFile);
        }

        await api.post('points', data);

        alert('Ponto de coleta cadastrado com sucesso');

        history.push('/');
    }

    return (
        <div id="page-create-point">
            <header>
                <img src={logo} alt="Logo ecoleta"/>

                <Link to="/">
                    <FiArrowLeft />
                    Voltar para home
                </Link>
            </header>

            <form onSubmit={handleSubmit}>
                <h1>Cadastro do <br /> ponto de coleta</h1>

                <Dropzone onFileUploaded={setSelectedFile} />

                <fieldset>
                    <legend>
                        <h2>Dados</h2>
                    </legend>

                    <div className="field">
                        <label htmlFor="name">Nome da entidade</label>
                        <input
                            onChange={handleInputChange} 
                            type="text"
                            name="name"
                            id="name"    
                        />
                    </div>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="email">E-mail</label>
                            <input
                                onChange={handleInputChange} 
                                type="email"
                                name="email"
                                id="email"    
                            />
                        </div>
                        <div className="field">
                            <label htmlFor="whatsapp">WhatsApp</label>
                            <input
                                onChange={handleInputChange} 
                                type="text"
                                name="whatsapp"
                                id="whatsapp"    
                            />
                        </div>
                    </div>
                </fieldset>
                
                <fieldset>
                    <legend>
                        <h2>Endereço</h2>
                        <span>Selecione o endereço do mapa</span>
                    </legend>

                    <Map 
                        center={initialPos} 
                        zoom={15}
                        onClick={handleMapClick}
                    >
                    <TileLayer
                        attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={selectedPos} />
                    </Map>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="uf">Estado(UF)</label>
                            <select 
                                onChange={handleSelectedUf} 
                                name="uf" 
                                id="uf" 
                                value={selectedUf}
                            >
                                <option value="0">Selecione uma UF</option>
                                {ufs.map(uf => (
                                    <option key={uf} value={uf}>{uf}</option>
                                ))}
                            </select>
                        </div>
                        <div className="field">
                            <label htmlFor="city">Cidade</label>
                            <select 
                                name="city" 
                                id="city" 
                                value={selectedCity}
                                onChange={handleSelectedCity}
                            >
                                <option value="0">Selecione uma cidade</option>
                                {cities.map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </fieldset>
                
                <fieldset>
                    <legend>
                        <h2>Itens de coleta</h2>
                        <span>Selecione um ou mais itens abaixo</span>
                    </legend>

                    <ul className="items-grid">
                        {items.map(item => (
                            <li 
                                key={item.id}
                                onClick={() => handleSelectItem(item.id)} 
                                className={selectedItens.includes(item.id) ? 'selected' : ''}
                            >
                                <img src={item.image_url} alt={item.title}/>
                                <span>{item.title}</span>
                            </li>
                        ))}
                    </ul>
                </fieldset>

                <button type="submit">Cadastrar ponto de coleta</button>
            </form>
        </div>
    );
}

export default CreatePoint;
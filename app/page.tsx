"use client"
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timeGrid';
import { db, auth } from './fonts/lib/firebase';
import { format, parse } from 'date-fns';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from "firebase/firestore";
import { GoogleAuthProvider, signInWithPopup, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { useState, useEffect } from "react";
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { FaGoogle } from 'react-icons/fa';
import './globals.css';

interface Event {
    firstName: string;
    lastName: string;
    startTime: string;
    endTime: string;
    id: string;
    status: string;
}

export default function Home() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const googleProvider = new GoogleAuthProvider();
    const [showModal, setShowModal] = useState(false);
    const [newEvent, setNewEvent] = useState<Event>({
        firstName: "",
        lastName: "",
        startTime: '',
        endTime: '',
        id: '',
        status: 'Available'
    });
    const [events, setEvents] = useState<Event[]>([]);
    const [user, setUser] = useState<any>(null);
    const [showLogin, setShowLogin] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            try {
                const currentUser = auth.currentUser;
                if (currentUser) {
                    setUser(currentUser);
                    setShowLogin(false);
                } else {
                    setShowLogin(true);
                }
            } catch (error) {
                console.error("Error checking user: ", error);
            }
        };

        checkUser().catch(console.error);
    }, []);

    useEffect(() => {
        const fetchEvents = async () => {
            if (user) {
                try {
                    const querySnapshot = await getDocs(collection(db, "bookings"));
                    const loadedEvents: Event[] = [];
                    querySnapshot.forEach((doc) => {
                        const data = doc.data() as Event;
                        if (data.startTime && data.endTime) {
                            loadedEvents.push(data);
                        }
                    });
                    setEvents(loadedEvents);
                } catch (error) {
                    console.error("Error fetching events: ", error);
                }
            }
        };
        fetchEvents().catch(console.error);
    }, [user]);

    const handleEmailLogin = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            console.log("User signed in with email:", email);
            setShowLogin(false); // Hide login form after successful sign-in
        } catch (error) {
            setErrorMessage("Invalid email or password.");
            console.error("Error signing in with email: ", error);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            console.log("User signed in:", result.user);
            setUser(result.user);
            setShowLogin(false);
        } catch (error) {
            console.error("Error with Google Sign-In:", error);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            setShowLogin(true);
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

    const handleDateClick = (arg: { date: Date, allDay: boolean }) => {
        const start = arg.date;
        const end = new Date(start.getTime() + 30 * 60 * 1000);

        setNewEvent({
            firstName: "",
            lastName: "",
            startTime: format(start, 'dd/MM/yyyy HH:mm'),
            endTime: format(end, 'dd/MM/yyyy HH:mm'),
            id: new Date().getTime().toString(),
            status: "Available"
        });

        setShowModal(true);
    };

    const saveEvent = async () => {
        try {
            const updatedEvent = {
                ...newEvent,
                status: "Unavailable"
            };
            await addDoc(collection(db, "bookings"), updatedEvent);
            setEvents((prevEvents) => [...prevEvents, updatedEvent]);
            console.log("Event added to Firestore:", updatedEvent);
        } catch (error) {
            console.error("Error adding event to Firestore: ", error);
        }
        setShowModal(false);
    };

    const handleEventDrop = async (info: any) => {
        const confirmMove = window.confirm("Voulez-vous vraiment déplacer ce rendez-vous ?");
        if (!confirmMove) {
            info.revert();
        } else {
            try {
                const oldEventQuery = query(collection(db, "bookings"), where("id", "==", info.event.extendedProps.id));
                const querySnapshot = await getDocs(oldEventQuery);

                querySnapshot.forEach(async (document) => {
                    await deleteDoc(doc(db, "bookings", document.id));
                });
                const updatedEvent = {
                    ...info.event.extendedProps,
                    startTime: format(info.event.start, 'dd/MM/yyyy HH:mm'),
                    endTime: format(info.event.end, 'dd/MM/yyyy HH:mm')
                };
                await addDoc(collection(db, "bookings"), updatedEvent);
                console.log("Événement mis à jour :", updatedEvent);
                setEvents((prevEvents) => prevEvents.map((event) =>
                    event.id === updatedEvent.id ? updatedEvent : event
                ));
            } catch (error) {
                console.error("Erreur lors de la mise à jour de l'événement :", error);
            }
        }
    };
    return (
        <main className="bg-gray-900 text-white min-h-screen">
            {showLogin ? (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="p-6 bg-gray-800 rounded-lg shadow-lg w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4 text-white text-center">Log in to calendar</h2>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-300">Email</label>
                            <input
                                type="email"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-black focus:border-indigo-500 focus:ring-indigo-500"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-300">Password</label>
                            <input
                                type="password"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-black focus:border-indigo-500 focus:ring-indigo-500"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                            />
                            {errorMessage && <p className="text-red-500 text-sm mt-2">{errorMessage}</p>}
                        </div>

                        <button
                            onClick={handleEmailLogin}
                            className="w-full inline-flex justify-center rounded-md border border-transparent bg-blue-500 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            Log in with Email
                        </button>

                        <div className="mt-4 flex justify-center">
                            <button
                                onClick={handleGoogleSignIn}
                                className="flex items-center px-4 py-2 bg-white rounded-full shadow-md text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <FaGoogle className="mr-2 text-lg" />
                                <span className="text-sm font-medium">Sign in with Google</span>
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                    <>
                    <div className="col-span-8 w-full h-10% max-h-full overflow-hidden">
                        <div className="col-span-8">
                            <FullCalendar
                                plugins={[dayGridPlugin, interactionPlugin, timeGridPlugin]}
                                headerToolbar={{
                                    left: 'prev,next today',
                                    center: 'title',
                                    right: 'logoutButton'
                                }}
                                customButtons={{
                                    logoutButton: {
                                        text: 'Log out',
                                        click: handleLogout,
                                    },
                                }}
                                nowIndicator={true}
                                initialView="timeGridWeek"
                                editable={true}
                                selectable={true}
                                dateClick={handleDateClick}
                                eventDrop={handleEventDrop}
                                slotMinTime="08:00:00"
                                slotMaxTime="18:00:00"
                                height="auto"
                                events={events.map(event => ({
                                    title: event.status === "Unavailable" ? "Réservé" : "",
                                    start: parse(event.startTime, 'dd/MM/yyyy HH:mm', new Date()),
                                    end: parse(event.endTime, 'dd/MM/yyyy HH:mm', new Date()),
                                    backgroundColor: event.status === "Unavailable" ? "red" : "green",
                                    borderColor: event.status === "Unavailable" ? "red" : "green",
                                    display: "block",
                                    extendedProps: event
                                }))}
                                views={{
                                    timeGridWeek: {
                                        allDaySlot: false,
                                        slotMinTime: "08:00:00",
                                        slotMaxTime: "18:00:00",
                                        titleFormat: { year: 'numeric', month: 'long' }
                                    },
                                }}
                            />
                        </div>
                    </div>
                    <Transition.Root show={showModal} as={Fragment}>
                        <Dialog as="div" className="relative z-10" onClose={() => setShowModal(false)}>
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0"
                                enterTo="opacity-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                            >
                                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                            </Transition.Child>

                            <div className="fixed inset-0 z-10 overflow-y-auto">
                                <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                                    <Transition.Child
                                        as={Fragment}
                                        enter="ease-out duration-300"
                                        enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                                        enterTo="opacity-100 translate-y-0 sm:scale-100"
                                        leave="ease-in duration-200"
                                        leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                                        leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                                    >
                                        <Dialog.Panel
                                            className="max-w-md p-6 mx-auto bg-white rounded-lg shadow-lg">
                                            <h3 className="text-lg font-medium leading-6 text-gray-900"></h3>
                                            <div className="mt-4 space-y-4">
                                                <p className="text-sm text-gray-500"></p>

                                                <div className="flex flex-col gap-4">
                                                    <label className="text-left">
                                                        <span className="text-sm font-medium text-gray-700">First name :</span>
                                                        <input
                                                            type="text"
                                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                            value={newEvent.lastName}
                                                            onChange={(e) => setNewEvent({
                                                                ...newEvent,
                                                                lastName: e.target.value
                                                            })}
                                                            placeholder="User first name :"
                                                        />
                                                    </label>
                                                    <label className="text-left">
                                                        <span
                                                            className="text-sm font-medium text-gray-700">Name :</span>
                                                        <input
                                                            type="text"
                                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                            value={newEvent.firstName}
                                                            onChange={(e) => setNewEvent({
                                                                ...newEvent,
                                                                firstName: e.target.value
                                                            })}
                                                            placeholder="User name :"
                                                        />
                                                    </label>
                                                </div>

                                                <p className="text-sm text-gray-500 mt-4"></p>
                                                <ul className="list-disc pl-5 text-left">
                                                    <li><strong>Start of slot :</strong> {newEvent.startTime}</li>
                                                    <li><strong>End of slot :</strong> {newEvent.endTime}</li>
                                                    <li><strong>Status :</strong> {newEvent.status}</li>
                                                </ul>
                                            </div>

                                            <div className="flex gap-4 mt-6 justify-end">
                                                <button
                                                    type="button"
                                                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-500 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                                    onClick={saveEvent}
                                                >
                                                    Enregistrer
                                                </button>
                                                <button
                                                    type="button"
                                                    className="inline-flex justify-center rounded-md border border-transparent bg-gray-300 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                                    onClick={() => setShowModal(false)}
                                                >
                                                    Annuler
                                                </button>
                                            </div>
                                        </Dialog.Panel>
                                    </Transition.Child>
                                </div>
                            </div>
                        </Dialog>
                    </Transition.Root>
                </>
            )}
        </main>
    );
}

import { useState } from "react";
import { scienceSchools } from "../data/schools";

export default function ProfileFields({ form, onChange, disabled = false }) {
  const [otherSchool, setOtherSchool] = useState(Boolean(form.school && !scienceSchools.includes(form.school)));
  const change = event => onChange({ ...form, [event.target.name]: event.target.value });
  return <>
    <div className="full-field"><label htmlFor="fullName">Full Name</label><input id="fullName" name="fullName" maxLength={150} value={form.fullName} onChange={change} required disabled={disabled} /></div>
    <div><label htmlFor="email">Email Address</label><input id="email" name="email" type="email" maxLength={150} value={form.email} onChange={change} required disabled={disabled} /></div>
    <div><label htmlFor="phone">Phone Number (optional)</label><input id="phone" name="phone" type="tel" maxLength={30} value={form.phone} onChange={change} disabled={disabled} /></div>
    <div className="full-field"><label htmlFor="indexNumber">Index Number (optional)</label><input id="indexNumber" name="indexNumber" maxLength={30} pattern={"[A-Za-z0-9\\-\\/]+"} title="Letters, numbers, slashes and hyphens only" value={form.indexNumber} onChange={change} disabled={disabled} aria-describedby="index-help" /><small id="index-help">You can also use this index number with your password to log in.</small></div>
    <div><label htmlFor="schoolChoice">School</label><select id="schoolChoice" value={otherSchool ? "__other__" : form.school} disabled={disabled} onChange={event => {
      setOtherSchool(event.target.value === "__other__");
      onChange({ ...form, school: event.target.value === "__other__" ? "" : event.target.value });
    }}><option value="">Select school</option>{scienceSchools.map(school => <option key={school}>{school}</option>)}<option value="__other__">Other</option></select>
    {otherSchool && <><label htmlFor="school">School Name</label><input id="school" name="school" maxLength={180} value={form.school} onChange={change} required disabled={disabled} placeholder="Enter your school name" /></>}</div>
    <div><label htmlFor="stream">A/L Stream</label><select id="stream" name="stream" value={form.stream} onChange={change} required disabled={disabled}><option value="">Select stream</option><option>Physical Science</option><option>Biological Science</option><option>Other</option></select></div>
    <div className="full-field"><label htmlFor="alYear">A/L Examination Year</label><input id="alYear" name="alYear" type="number" min="2000" max="2100" value={form.alYear} onChange={change} disabled={disabled} /></div>
  </>;
}
